"""Relatório de LPS com fontes de uma revisão GitHub fixada e evidências isoladas."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import re
import unicodedata
from reportlab.graphics.shapes import Drawing, Rect, Line, String
from reportlab.lib import colors

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
REVISION='5435ce33c7c0cb0f5cd226938793e771464b64a9'
parser=argparse.ArgumentParser()
parser.add_argument('--source-root',type=Path,default=ROOT/'tmp/relatorio-lps/referencia')
args=parser.parse_args()
SOURCE=args.source_root.resolve()
spec=importlib.util.spec_from_file_location('report_renderer',ROOT/'docs/relatorio/gerar_relatorio.py')
r=importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)
r.HERE=HERE
r.FIGURES=HERE/'figuras'
r.OUT=HERE/'relatorio-lps.pdf'
r.MARKDOWN_OUT=ROOT/'docs/relatorio-lps.md'
r.FIGURES_RELATIVE='relatorio-lps/figuras'
r.IMAGE_CROPS={'gateway-lps.png': (0,0,720,215)}
r.REVISION=REVISION
r.REPORT_TITLE='Gerar Commerce - Linha de Produtos de Software'
r.REPORT_AUTHOR='Caio Mascarenhas Soares; Laura Marques Costa'
r.COVER_SUBTITLE='Linha de produtos de software para e-commerce com microsserviços e componentes reutilizáveis'
r.COVER_COURSE='Tópico em Engenharia de Software<br/>Projetando Linhas de Produto de Software'
r.COVER_AUTHORS='Caio Mascarenhas Soares<br/>Laura Marques Costa'
r.REFERENCE_SECTION='10'
original_diagram=r.diagram
W=r.WIDTH


def mini(d,x,y,w,h,text,dashed=False):
    d.add(Rect(x,y,w,h,fillColor=colors.white,strokeColor=colors.black,strokeWidth=.6,strokeDashArray=[3,2] if dashed else None))
    d.add(String(x+w/2,y+h/2-3,text,fontName='Sans',fontSize=8.2,textAnchor='middle'))


def diagrams(key):
    if key=='features':
        d=Drawing(W,495)
        mini(d,126,445,200,45,'Loja Gerar Commerce')
        groups=[(0,'Núcleo [7..7]',['Catálogo','Estoque','Carrinho','Checkout','Pedidos','Recomendações','Administração']),
                (154,'Categoria [1..1]',['Eletrônicos','Construção','Roupas']),
                (308,'Opcionais [0..4]',['Cupons','Avaliações','Entrega local','Agente de IA'])]
        for x,title,names in groups:
            bw=145 if x!=308 else W-308
            r.arrow(d,W/2,445,x+bw/2,415)
            mini(d,x,365,bw,50,title)
            gap=41 if x==0 else 59
            dashed=x==308
            line_style={'strokeColor':colors.black,'strokeWidth':.7}
            if dashed: line_style['strokeDashArray']=[3,2]
            # Features are siblings of their group, without dependencies
            # between optional features or between category alternatives.
            bus=x+6
            last_center=319-(len(names)-1)*gap+17
            d.add(Line(x+bw/2,365,x+bw/2,358,**line_style))
            d.add(Line(x+bw/2,358,bus,358,**line_style))
            d.add(Line(bus,358,bus,last_center,**line_style))
            for i,name in enumerate(names):
                y=319-i*gap
                r.arrow(d,bus,y+17,x+20,y+17,dashed=dashed)
                mini(d,x+20,y,bw-24,34,name,dashed=dashed)
        d.add(String(0,12,'Cardinalidades: todos os 7; exatamente 1 categoria; qualquer subconjunto dos 4 opcionais.',fontName='Sans',fontSize=8))
        return d,'Modelo de features com grupos obrigatórios, categoria exclusiva e opcionais independentes.'
    if key=='layers':
        d=Drawing(W,455)
        data=[(390,65,'Apresentação',['Angular + Nginx: plataforma, cadastro, vitrine e administração']),
              (305,65,'Entrada',['Gateway: rotas /api, cookies, limites e autorização']),
              (205,80,'Serviços de domínio',['Lojas | Catálogo | Estoque | Pedidos | Recomendações | IA','Processos NestJS independentes; integração HTTP/JSON']),
              (105,80,'Ativos de reuso em bibliotecas',['framework: composição, features, planos e políticas','contracts: tipos | platform: bootstrap, HTTP e PostgreSQL']),
              (0,80,'Persistência',['PostgreSQL 17: stores, catalog, inventory e orders','Instância e credencial compartilhadas na demonstração'])]
        for y,h,name,body in data:r.box(d,0,y,W,h,name,body,'camada')
        for top,bottom in [(390,370),(305,285),(205,185),(105,80)]:r.arrow(d,W/2,top,W/2,bottom)
        return d,'Camadas da solução e dependências. Os ativos de reuso executam nos serviços consumidores.'
    if key=='variability':
        d=Drawing(W,435)
        rows=[('Categoria','Eletrônicos | Construção | Roupas','Exatamente uma escolha'),
              ('Descontos','Sem cupons | Cupons persistidos','Presença opcional'),
              ('Avaliações','Sem avaliações | Compra verificada','Presença opcional'),
              ('Recebimento','Retirada | Retirada + entrega R$ 15,00','Retirada permanece disponível'),
              ('Inteligência','Sem agente | Mastra + Gemini','Presença opcional')]
        for i,(point,values,rule) in enumerate(rows):
            y=350-i*82
            r.box(d,0,y,150,75,point,['Ponto de variação'],'variação')
            r.box(d,190,y,W-190,75,'Variantes',[values,rule],'seleção')
            r.arrow(d,150,y+37,190,y+37)
        return d,'Pontos de variação, alternativas e restrições. A seleção é vinculada no cadastro e nas configurações.'
    if key=='components':
        d=Drawing(W,405)
        r.box(d,110,315,W-220,85,'ComponentRegistry',['ComponentDescriptor: id, feature, service'],'registro')
        r.box(d,0,100,W/2-10,155,'Componentes obrigatórios',['catalog -> Catálogo','inventory -> Estoque','orders / checkout -> Pedidos','recommendations -> Recomendações','cart / administration -> Angular'],'núcleo')
        r.box(d,W/2+10,100,W/2-10,155,'Componentes opcionais',['coupons / delivery -> Pedidos','reviews -> Catálogo','aiAssistant -> IA','Ausência bloqueia uso da variante'],'variantes')
        r.arrow(d,W/2-35,315,W/4,255)
        r.arrow(d,W/2+35,315,W*.75,255,dashed=True)
        r.box(d,0,0,W,75,'Construção da aplicação',['CommerceApplication.build(): núcleo + extensões validadas','ConfiguredStore: definição da loja -> blueprint, plano e tema'],'framework')
        r.arrow(d,W/4,100,W/4,75)
        r.arrow(d,W*.75,100,W*.75,75,dashed=True)
        return d,'Componentes e variabilidade da composição. Linhas tracejadas indicam participação condicional.'
    if key=='architecture-lps':
        d=Drawing(W,555)
        r.box(d,110,475,W-220,75,'Nginx / Angular',['Host 4200; HTTP /api'],'apresentação')
        r.box(d,110,375,W-220,75,'Gateway 3000',['Sessões e roteamento'],'NestJS')
        r.arrow(d,W/2,475,W/2,450)
        d.add(Rect(0,115,W,235,fillColor=colors.HexColor('#f8f8f8'),strokeColor=colors.gray,strokeWidth=.6))
        d.add(String(W/2,334,'Serviços internos HTTP',fontName='Sans-Bold',fontSize=9,textAnchor='middle'))
        r.arrow(d,W/2,375,W/2,350)
        bw=(W-30)/3
        for i,(name,port) in enumerate([('Lojas','3006'),('Catálogo','3001'),('Estoque','3002'),('Pedidos','3003'),('Recomendações','3004'),('IA','3005')]):
            x=7+(i%3)*(bw+8);y=238 if i<3 else 135
            r.box(d,x,y,bw,80,name,[port],'NestJS')
        r.box(d,0,0,W*.72,85,'PostgreSQL 17',['stores | catalog | inventory | orders','Host 5433; volume commerce-data'],'persistência')
        r.box(d,W*.75,0,W*.25,85,'Gemini',['Via Mastra'],'API externa')
        r.arrow(d,W*.35,115,W*.35,85)
        r.arrow(d,W*.87,135,W*.87,85)
        return d,'Arquitetura com sete processos NestJS, apresentação e banco, totalizando nove contêineres.'
    if key=='recommendation-flow':
        d=Drawing(W,440)
        r.box(d,100,350,W-200,85,'Gateway + sessão',['GET /stores/:slug/recommendations','Conta validada ou visitante'],'entrada')
        r.box(d,100,245,W-200,80,'Recomendações 3004',['Consulta quatro conjuntos de dados'],'componente')
        r.arrow(d,W/2,350,W/2,325)
        bw=(W-20)/3
        for i,(name,lines) in enumerate([('Catálogo',['Produtos ativos']),('Estoque',['Saldos disponíveis']),('Pedidos',['Histórico aprovado','Cestas da loja'])]):
            x=i*(bw+10)
            r.box(d,x,120,bw,90,name,lines,'API')
            r.arrow(d,W/2,245,x+bw/2,210)
            r.arrow(d,x+bw/2,120,x+bw/2,90)
        r.box(d,0,0,W,90,'Ranking e resposta',['Exclui comprados e esgotados; combina C, T, P e F','Até 3 produtos com motivo e estratégia; sem chamada ao Gemini'],'algoritmo')
        return d,'Fluxo da recomendação: identidade por sessão, APIs de domínio, filtragem e ranking explicável.'
    return original_diagram(key)


def build_content():
    text=(HERE/'conteudo.md').read_text(encoding='utf8')
    backlog=json.loads((ROOT/'docs/gestao/backlog.json').read_text(encoding='utf8'))
    states={'done':'Concluído','review':'Em revisão','todo':'Pronto','backlog':'Backlog'}
    rows=[['ID','Item do Product Backlog','P','Ciclo','Estado registrado']]
    for item in backlog['issues']:rows.append([item['id'],item['title'],item['priority'],item['cycle'],states[item['status']]])
    text=text.replace('{{backlog}}',r.markdown_table(rows))
    gateway=[row[:] for row in r.GATEWAY]
    gateway.insert(7,['GET L/recommendations','Conta identificada pela sessão ou visitante; até três sugestões.'])
    gateway.insert(8,['GET L/recommendations/:customerId','Exige comprador e ID correspondente à própria conta.'])
    text=text.replace('{{gateway-api}}',r.markdown_table(gateway))
    services=[row[:] for row in r.SERVICE_API]
    services.insert(-3,['Recomendações: GET /stores/:slug/recommendations/:customerId','Consulta catálogo, estoque e pedidos; filtra e pontua até três candidatos.'])
    services.insert(-3,['Pedidos: GET S/history/:customerId e S/baskets','Até 100 pedidos aprovados da conta e 300 cestas aprovadas da loja.'])
    services[-1]=['Todos: GET /api/health; Swagger /docs','Nome, porta, armazenamento declarado e documentação do processo.']
    text=text.replace('{{service-api}}',r.markdown_table(services))
    linkrows=[['Ativo ou serviço','Código-fonte completo no GitHub']]
    paths=['backend/packages/framework/src','backend/packages/contracts/src','backend/packages/platform/src','backend/services/gateway/src','backend/services/stores/src','backend/services/catalog/src','backend/services/inventory/src','backend/services/orders/src','backend/services/recommendations/src','backend/services/ai-assistant/src','frontend/src/app','compose.yaml']
    for path in paths:
        kind='blob' if path.endswith('.yaml') else 'tree'
        linkrows.append([path.split('/')[-2] if path.endswith('/src') else path,f'[{path}](https://github.com/CaioMascarenhas/gerar-commerce/{kind}/{REVISION}/{path})'])
    text=text.replace('{{source-links}}',r.markdown_table(linkrows))
    evidence=json.loads((HERE/'evidencia-lps.json').read_text(encoding='utf8'))
    validation=[['Verificação desta revisão','Resultado registrado'],['Builds de backend e frontend','Concluídos pelo runner Docker antes das capturas.'],['Cadastro pela interface','Ateliê Horizonte publicado com 7 recursos core, 3 opcionais e plano de 9990 centavos.'],['Ranking personalizado','Hub Beta em primeiro; produto comprado e produto esgotado excluídos.'],['Visitante','Estratégia store-popularity, com Sensor Alpha em primeiro.'],['Isolamento de histórico','Consulta a ID diferente da conta retorna 403.'],['Saúde','Seis serviços internos e gateway responderam com status ok.'],['Gemini nesta rodada','Desativado; nenhuma nova chamada real foi declarada.']]
    assert evidence['foreignHistoryStatus']==403
    text=text.replace('{{validation}}',r.markdown_table(validation))
    excerpts=[]
    def source(match):
        path,start,end=match.group(1).split('|')
        raw=(SOURCE/path).read_text(encoding='utf8')
        begin=raw.index(start);begin=raw.rfind('\n',0,begin)+1
        finish=raw.index(end,begin+len(start))
        selected=raw[begin:finish].rstrip()
        excerpts.append({'path':path,'startLine':raw[:begin].count('\n')+1,'lines':len(selected.splitlines()),'sha256':hashlib.sha256(selected.encode()).hexdigest()})
        return f'Fonte: `{path}`.\n\n```typescript\n{selected}\n```'
    text=re.sub(r'\{\{source:(.*?)\}\}',source,text)
    files=[]
    for file in sorted((SOURCE/'backend').glob('**/src/*.ts')):
        files.append({'path':file.relative_to(SOURCE).as_posix(),'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'delivery':'github'})
    meta={'revision':REVISION,'authors':['Caio Mascarenhas Soares','Laura Marques Costa'],'date':'2026-11-10','sourceFiles':files,'selectedExcerpts':excerpts,'githubEvidence':'github.json','runtimeEvidence':'evidencia-lps.json'}
    (HERE/'fontes.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    return text


if __name__=='__main__':
    r.diagram=diagrams
    r.make_pdf(build_content())
