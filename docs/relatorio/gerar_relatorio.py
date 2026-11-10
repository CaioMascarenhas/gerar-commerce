"""Gera o relatório acadêmico e sua fonte Markdown expandida.

Dependências: reportlab, Pillow e pypdf. Executar na raiz do repositório.
As figuras usam capturas reais; os diagramas são vetoriais e autorais.
"""
from pathlib import Path
from xml.sax.saxutils import escape
import hashlib
import json
import math
import re
import textwrap

from PIL import Image as PILImage
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Frame, Image, KeepTogether, PageBreak,
    PageTemplate, Paragraph, Preformatted, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.graphics.shapes import Drawing, Rect, Line, String, Polygon
from reportlab.graphics import renderSVG
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Flowable

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
FIGURES = HERE / 'figuras'
OUT = HERE / 'relatorio-reuso.pdf'
REVISION = 'be534c187ffa2d8baa5f21de7943fb6e406c299b'
REPOSITORY = 'https://github.com/CaioMascarenhas/gerar-commerce'
REPORT_TITLE = 'Gerar Commerce - Relatório de Reuso de Software'
REPORT_AUTHOR = 'Caio Mascarenhas Soares'
COVER_SUBTITLE = 'Framework para sistemas de e-commerce usando microsserviços e componentes de software'
COVER_COURSE = 'Relatório de Reuso de Software<br/>e Metodologias Ágeis'
COVER_AUTHORS = 'Caio Mascarenhas Soares<br/>Matrícula 22111481'
REFERENCE_SECTION = '11'
MARKDOWN_OUT = ROOT / 'docs/relatorio-reuso.md'
FIGURES_RELATIVE = 'relatorio/figuras'
IMAGE_CROPS = {'selecao-features.png': (137,511,820,812)}
WIDTH = A4[0] - 5 * cm


def setup_fonts():
    fonts = Path('C:/Windows/Fonts')
    if fonts.exists():
        files = {'Body': 'times.ttf', 'Body-Bold': 'timesbd.ttf',
                 'Body-Italic': 'timesi.ttf', 'Mono': 'consola.ttf',
                 'Sans': 'arial.ttf', 'Sans-Bold': 'arialbd.ttf', 'GlyphFallback': 'seguisym.ttf'}
    else:
        fonts = Path('/usr/share/fonts/truetype/dejavu')
        files = {'Body': 'DejaVuSerif.ttf', 'Body-Bold': 'DejaVuSerif-Bold.ttf',
                 'Body-Italic': 'DejaVuSerif-Italic.ttf', 'Mono': 'DejaVuSansMono.ttf',
                 'Sans': 'DejaVuSans.ttf', 'Sans-Bold': 'DejaVuSans-Bold.ttf', 'GlyphFallback': 'DejaVuSans.ttf'}
    for name, file in files.items():
        pdfmetrics.registerFont(TTFont(name, str(fonts / file)))
    pdfmetrics.registerFontFamily('Body', normal='Body', bold='Body-Bold', italic='Body-Italic')


def code_file(path):
    raw = (ROOT / path).read_text(encoding='utf-8-sig')
    return raw.rstrip() + '\n'


GATEWAY = [
    ['Método e rota pública', 'Contrato e regra de acesso'],
    ['GET /features e /stores', 'Features, categorias e lojas ativas; público.'],
    ['POST /stores', 'Identidade, capa, senha, categoria, opções e 1 a 30 produtos; limite por IP.'],
    ['POST /generate-products', 'Nome/categoria; três rascunhos com origem explícita.'],
    ['GET L', 'Identidade e blueprint; sem senha ou sessão.'],
    ['GET L/products e L/products/:id', 'Catálogo ou detalhe da própria loja; público.'],
    ['GET L/stock', 'Lista productId e available; público.'],
    ['POST L/login e L/logout; GET L/session', 'Senha e sessão administrativa; cookie específico da loja.'],
    ['PUT L/settings', 'Identidade, capa, categoria e opções; exige administração; slug fixo.'],
    ['POST L/products; PUT/DELETE L/products/:id', 'CRUD de produto e saldo; exige administração.'],
    ['GET L/orders', 'Até 100 pedidos; exige administração.'],
    ['POST L/customers e L/customer-login', 'Conta com nome, e-mail e senha; login do comprador.'],
    ['GET L/customer-session e L/customer-orders', 'Perfil e até 100 pedidos pessoais; comprador autenticado.'],
    ['POST L/customer-logout', 'Revoga somente a sessão do comprador.'],
    ['POST L/checkout', 'Referência, itens, pagamento e recebimento; comprador autenticado.'],
    ['GET L/coupons; PUT/DELETE L/coupons/:code', 'Códigos persistidos; administração e feature coupons.'],
    ['POST L/coupon-quote', 'Código e subtotal para prévia; público com coupons.'],
    ['GET/POST L/reviews/:id', 'Leitura pública; escrita com login e compra aprovada; exige reviews.'],
    ['GET L/review-eligibility/:id', 'Consulta compra aprovada; comprador e reviews.'],
    ['POST L/chat', 'Mensagem/histórico curto; texto e links; público com aiAssistant.'],
    ['GET L/assistant-status; POST L/assistant', 'Estado sem segredos; pergunta ao agente; administração e IA.'],
    ['GET /health e /services', 'Saúde do gateway e dos cinco serviços internos.'],
]

SERVICE_API = [
    ['Componente e rotas', 'Responsabilidade e comportamento'],
    ['Lojas: GET /features, /stores, /stores/:slug; POST /internal/stores; PUT S', 'Seleção, cadastro e atualização; ativa após provisionar produtos e saldos.'],
    ['Lojas: POST S/login e S/session; DELETE S/session', 'Senha scrypt; token aleatório com hash e validade.'],
    ['Compradores: POST S/customers, S/customer-login e S/customer-session; DELETE S/customer-session', 'Conta por loja e e-mail normalizado; sessão independente.'],
    ['Catálogo: GET /stores/:slug/products e /products/:id; POST S/seed e S/products; PUT/DELETE S/products/:id; DELETE S', 'Consulta, CRUD e compensação; retirada lógica preserva histórico.'],
    ['Avaliações: GET /stores/:slug/reviews/:id; POST S/review-eligibility/:id e S/reviews/:id', 'Sessão validada por lojas e compra aprovada consultada em pedidos.'],
    ['Estoque: GET /stores/:slug/stock; POST S/seed; PUT S/stock/:id; DELETE S', 'Consulta, carga inicial, ajuste e compensação.'],
    ['Reservas: POST S/reserve e S/reservations/:reference/:action', 'Reserva atômica; action confirm ou release; idempotência por referência.'],
    ['Pedidos: POST S/checkout; GET S/orders, S/customer-orders/:customerId e S/purchases/:customerId/:productId', 'Cotação oficial, tentativa durável, histórico e comprovação de compra.'],
    ['Cupons: GET S/coupons; PUT/DELETE S/coupons/:code; POST S/coupon-quote', 'Percentual de 1 a 100, compra mínima, ativação e validade.'],
    ['IA: GET /internal/status; POST /internal/generate-products', 'Estado da configuração e três rascunhos.'],
    ['IA: POST S/shopping-chat e S/query', 'Chat limitado ao catálogo; agente administrativo com ferramentas.'],
    ['Todos: GET /health; Swagger /docs', 'Nome, porta, armazenamento declarado e documentação do processo.'],
]


def markdown_table(rows):
    return '\n'.join(['| ' + ' | '.join(r) + ' |' for r in [rows[0], ['---'] * len(rows[0]), *rows[1:]]])


def expand_source():
    text = (HERE / 'conteudo.md').read_text(encoding='utf8')
    backlog = json.loads((ROOT / 'docs/gestao/backlog.json').read_text(encoding='utf8'))
    status = {'done': 'Concluído', 'review': 'Em revisão', 'todo': 'Pronto', 'backlog': 'Backlog'}
    rows = [['ID', 'Item do Product Backlog', 'P', 'Ciclo', 'Estado registrado']]
    for issue in backlog['issues']:
        rows.append([issue['id'], issue['title'], issue['priority'], issue['cycle'], status.get(issue['status'], issue['status'])])
    text = text.replace('{{backlog}}', markdown_table(rows))
    text = text.replace('{{gateway-api}}', markdown_table(GATEWAY))
    text = text.replace('{{service-api}}', markdown_table(SERVICE_API))
    code_root=f'https://github.com/CaioMascarenhas/gerar-commerce/tree/{REVISION}'
    blob_root=f'https://github.com/CaioMascarenhas/gerar-commerce/blob/{REVISION}'
    locations=[
        ('Framework de composição e políticas','backend/packages/framework/src'),
        ('Contratos de configuração e componentes','backend/packages/contracts/src'),
        ('Infraestrutura HTTP e PostgreSQL','backend/packages/platform/src'),
        ('Agentes Mastra, ferramentas e geração','backend/services/ai-assistant/src'),
        ('Lojas e contas','backend/services/stores/src'),
        ('Catálogo e avaliações','backend/services/catalog/src'),
        ('Estoque e reservas','backend/services/inventory/src'),
        ('Pedidos e cupons','backend/services/orders/src'),
        ('API gateway','backend/services/gateway/src'),
        ('Páginas e componentes Angular','frontend/src/app'),
        ('Docker Compose','compose.yaml'),
    ]
    links=[['Parte do projeto','Código-fonte na revisão de referência']]
    for label,path in locations:
        base=blob_root if path.endswith('.yaml') else code_root
        links.append([label,f'[{path}]({base}/{path})'])
    text=text.replace('{{source-links}}',markdown_table(links))
    excerpts=[]

    def source(match):
        parts=match.group(1).split('|')
        path, start, end = parts[:3]
        raw = code_file(path)
        offset=raw.index(parts[3]) if len(parts)>3 else 0
        begin = raw.index(start,offset)
        finish = raw.index(end, begin + len(start))
        # Preserve beginning of indentation for a class or decorator.
        begin = raw.rfind('\n', 0, begin) + 1
        selected=raw[begin:finish].rstrip()
        excerpts.append({'path':path,'startLine':raw[:begin].count('\n')+1,'lines':len(selected.splitlines()),'sha256':hashlib.sha256(selected.encode('utf8')).hexdigest()})
        return f'Fonte: `{path}`.\n\n```typescript\n{selected}\n```'

    text = re.sub(r'\{\{source:(.*?)\}\}', source, text)
    manifests = []
    for folder in ['services','packages']:
        names = ['gateway', 'stores', 'catalog', 'inventory', 'orders', 'ai-assistant'] if folder == 'services' else ['contracts', 'framework', 'platform']
        for name in names:
            files = sorted((ROOT / 'backend' / folder / name / 'src').rglob('*.ts'))
            for file in files:
                path = file.relative_to(ROOT).as_posix()
                manifests.append({'path': path, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'lines': len(code_file(path).splitlines()),'delivery':'github','url':f'{blob_root}/{path}'})
    (ROOT / 'docs/relatorio-reuso.md').write_text(text, encoding='utf8')
    (HERE / 'fontes.json').write_text(json.dumps({'revision': REVISION, 'date': '2026-11-10', 'sourceFiles': manifests,'selectedExcerpts':excerpts}, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    return text


def rich(text):
    text = escape(text)
    text = re.sub(r'`([^`]+)`', r'<font name="Mono" size="9.2">\1</font>', text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    links=[]
    def named_link(match):
        links.append(f'<link href="{match.group(2)}" color="#222222">{match.group(1)}</link>')
        return f'LINKPLACEHOLDER{len(links)-1}END'
    text=re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)',named_link,text)
    text = re.sub(r'(https?://[^\s<]+)', lambda m: f'<link href="{m.group(1)}" color="#222222">{m.group(1)}</link>', text)
    for i,link in enumerate(links):text=text.replace(f'LINKPLACEHOLDER{i}END',link)
    return text


def box(d, x, y, w, h, title, lines, kind='class'):
    d.add(Rect(x, y, w, h, fillColor=colors.white, strokeColor=colors.HexColor('#333333'), strokeWidth=.65))
    if kind:
        d.add(String(x+w/2, y+h-12, f'«{kind}»', fontName='Sans', fontSize=7.6, textAnchor='middle'))
    d.add(String(x+w/2, y+h-25, title, fontName='Sans-Bold', fontSize=9, textAnchor='middle'))
    d.add(Line(x, y+h-33, x+w, y+h-33, strokeWidth=.5, strokeColor=colors.gray))
    yy = y+h-46
    for line in lines:
        for sub in textwrap.wrap(line, width=max(18, int((w-16)/4.25)), break_long_words=False) or ['']:
            d.add(String(x+8, yy, sub, fontName='Sans', fontSize=8))
            yy -= 11


def arrow(d, x1, y1, x2, y2, triangle=False, dashed=False):
    d.add(Line(x1,y1,x2,y2,strokeColor=colors.HexColor('#444444'),strokeWidth=.7,strokeDashArray=[3,2] if dashed else None))
    a = math.atan2(y2-y1, x2-x1)
    backx, backy = x2-7*math.cos(a), y2-7*math.sin(a)
    points = [x2,y2,backx-3.3*math.sin(a),backy+3.3*math.cos(a),backx+3.3*math.sin(a),backy-3.3*math.cos(a)]
    d.add(Polygon(points, fillColor=colors.white if triangle else colors.HexColor('#444444'), strokeColor=colors.HexColor('#444444'),strokeWidth=.65))


COMPONENTS = {
 'stores': ('Lojas e identidades', ['GET features / stores', 'POST cadastro / login / sessão', 'PUT configuração'], 'StoresController', ['+features(), list(), get()', '+create(), update()', '+login(), session(), logout()'], 'CustomersController', ['+register(), login()', '+current(), logout()', 'stores: lojas e contas']),
 'catalog': ('Catálogo e avaliações', ['Produtos da loja e detalhes', 'CRUD interno e avaliações', 'Elegibilidade de compra'], 'CatalogController', ['+product(), list(), seed()', '+create(), update(), remove()', '+reviews(), eligibility(), review()'], 'platform', ['database / migrate()', 'callService(): lojas e pedidos', 'catalog: products / reviews']),
 'inventory': ('Estoque e reservas', ['GET saldos por loja', 'POST reserva / finalizar', 'PUT ajuste de saldo'], 'InventoryController', ['+list(), seed(), cleanup()', '+update(), reserve()', '+finish()'], 'StockItem', ['productId: string', 'available: number', 'inventory: stock / reservations']),
 'orders': ('Pedidos e cupons', ['POST checkout autenticado', 'GET pedidos / compra verificada', 'CRUD de cupons'], 'OrdersController', ['+customerOrders(), list()', '+purchased(), checkout()', 'prepare(): intenção durável'], 'CouponsController', ['+list(), save(), remove(), quote()', 'quoteCheckout / SimulatedPayment', 'orders: purchases / attempts / coupons']),
 'assistant': ('Inteligência artificial', ['Geração de três produtos', 'Chat de produtos por loja', 'Agente administrativo'], 'AssistantController', ['+status(), generate()', '+shopping(), query()', 'Sem persistência própria'], 'Agent / createTool', ['Mastra + Gemini', 'Ferramentas stock e sales', 'HTTP: catálogo, estoque, pedidos']),
 'gateway': ('API pública', ['HTTP /api por loja', 'Cookies de comprador e dono', 'Saúde agregada'], 'GatewayController', ['+create(), checkout(), settings()', '+review(), chat(), query()', '+services() e demais rotas'], 'platform', ['callService()', 'bootstrap() / healthController()', 'Timeout e credencial interna']),
}


def diagram(key):
    w = WIDTH
    if key == 'mastra':
        d=Drawing(w,370)
        centers=[w*(i+.5)/4 for i in range(4)]
        actors=['Gateway','AssistantController','Mastra / Gemini','APIs de domínio']
        for x,label in zip(centers,actors):
            d.add(Rect(x-53,323,106,43,fillColor=colors.white,strokeColor=colors.black,strokeWidth=.6))
            d.add(String(x,341,label,fontName='Sans-Bold',fontSize=8,textAnchor='middle'))
            d.add(Line(x,25,x,323,strokeColor=colors.gray,strokeWidth=.6,strokeDashArray=[3,3]))
        messages=[(0,1,'1. POST query'),(1,2,'2. Agent + tools'),(2,1,'3. solicitar tool'),(1,3,'4. execute: HTTP da loja'),(3,1,'5. dados consultados'),(1,2,'6. resultado da tool'),(2,1,'7. response.text'),(1,0,'8. JSON de resposta')]
        for i,(a,b,label) in enumerate(messages):
            y=295-i*35
            arrow(d,centers[a],y,centers[b],y,dashed=i in [2,4,6])
            d.add(String((centers[a]+centers[b])/2,y+8,label,fontName='Sans',fontSize=7.5,textAnchor='middle'))
        return d,'Ciclo administrativo com Mastra. As ferramentas são acionadas conforme a pergunta, usando a loja fixada pelo servidor.'
    if key == 'composition':
        d = Drawing(w, 345)
        bw = w/2-10
        box(d,0,245,bw,95,'CommerceApplication',['+build(): ApplicationBlueprint','#registerCore(registry)'],'abstract')
        box(d,w/2+10,245,bw,95,'ComponentRegistry',['+register(ComponentDescriptor)','+list(): ComponentDescriptor[]'])
        box(d,0,125,bw,85,'ApplicationBlueprint',['configuration: ProductConfiguration','components: ComponentDescriptor[]'],'interface TypeScript')
        box(d,w/2+10,125,bw,85,'ComponentDescriptor',['id: string / feature: Feature','service: string'],'interface TypeScript')
        box(d,0,0,w,85,'Componentes concretos',['StoresController / CustomersController / CatalogController / InventoryController','OrdersController / CouponsController / AssistantController / GatewayController','Frontend: StorePage, AdminPage e componentes Angular'],'classes em processos próprios')
        arrow(d,bw,290,w/2+10,290)
        arrow(d,bw/2,245,bw/2,210)
        arrow(d,w*.75,245,w*.75,210)
        arrow(d,bw,168,w/2+10,168)
        arrow(d,w*.75,125,w*.75,85,dashed=True)
        return d, 'Relação entre framework, descritores e componentes executores. A ligação a controladores é um mapeamento por serviço.'
    if key in COMPONENTS:
        title, interface, cls, methods, dep, deps = COMPONENTS[key]
        d = Drawing(w, 255)
        box(d, 110, 175, w-220, 80, title, interface, 'contrato HTTP')
        box(d, 0, 0, w/2-9, 120, cls, methods)
        box(d, w/2+9, 0, w/2-9, 120, dep, deps, 'componente / tipo')
        arrow(d, w/4, 120, w/2-25, 175, triangle=True, dashed=True)
        arrow(d, w/2-9, 57, w/2+9, 57)
        return d, f'Componente {title.lower()}: contrato de comunicação, classes e colaboradores.'
    if key == 'framework':
        d = Drawing(w, 405)
        box(d, 100, 265, w-200, 140, 'CommerceApplication', ['+build(): ApplicationBlueprint', '#configure(): ProductConfiguration', '#shippingPolicy(): ShippingPolicy', '#registerExtensions(registry, config)', '-registerCore(registry)'], 'abstract')
        names = [('EssentialStore', ['#configure()', '#shippingPolicy()']), ('AssistedStore', ['#configure()', '#shippingPolicy()', '#registerExtensions()']), ('ConfiguredStore', ['-store: StoreDefinition', '#configure() / #shippingPolicy()', '#registerExtensions()'])]
        cw = (w-20)/3
        for i,(name,lines) in enumerate(names):
            x=i*(cw+10)
            box(d,x,100,cw,110,name,lines)
            arrow(d,x+cw/2,210,w/2,265,triangle=True)
        box(d,0,0,w/2-10,75,'ComponentRegistry',['+register(ComponentDescriptor)', '+list(): ComponentDescriptor[]'])
        box(d,w/2+10,0,w/2-10,75,'ShippingPolicy',['+quoteInCents(): number'],'interface')
        return d, 'Classes do framework e seus pontos de adaptação. As subclasses preservam o fluxo de build().'
    if key == 'policies':
        d=Drawing(w,280)
        data=[('ShippingPolicy',['+quoteInCents(): number'],['PickupShipping','FlatRateShipping']),('DiscountPolicy',['+discount(subtotal): number'],['PercentageDiscount','WelcomeDiscount']),('PaymentProvider',['+authorize(result): status'],['SimulatedPayment'])]
        for i,(name,methods,implementers) in enumerate(data):
            y=190-i*94
            box(d,0,y,w/2-10,87,name,methods,'interface')
            box(d,w/2+10,y,w/2-10,87,'Implementações',implementers,'class')
            arrow(d,w/2+10,y+43,w/2-10,y+43,triangle=True,dashed=True)
        return d, 'Interfaces e implementações das políticas de entrega, desconto e pagamento.'
    if key == 'frontend':
        d=Drawing(w,270)
        box(d,110,180,w-220,90,'Páginas Angular',['HomePage / BuilderPage','StorePage / AdminPage'],'componentes')
        box(d,0,0,w/2-10,120,'Componentes reutilizados',['FeaturePicker / CategoryIcon','ImageEditor / CommerceImage','BuyerAccount / ShoppingChat'],'standalone')
        box(d,w/2+10,0,w/2-10,120,'Api / StoreSessions',['get(), post(), put(), delete()','Estado de perfis por loja','HTTP para gateway'],'serviços Angular')
        arrow(d,w/2-30,180,w/4,120)
        arrow(d,w/2+30,180,3*w/4,120)
        return d,'Componentes da interface e serviços compartilhados. Nomes de métodos da API correspondem às operações HTTP.'
    if key == 'architecture':
        d=Drawing(w,430)
        def simple(x,y,bw,title,items): box(d,x,y,bw,77,title,items,'processo')
        simple(115,353,w-230,'Nginx / Angular',['Host 4200; HTTP /api'])
        simple(115,248,w-230,'Gateway',['3000; sessão e roteamento'])
        arrow(d,w/2,353,w/2,325)
        gap=7; bw=(w-4*gap)/5
        names=[('Lojas','3006'),('Catálogo','3001'),('Estoque','3002'),('Pedidos','3003'),('IA','3005')]
        for i,(name,port) in enumerate(names):
            x=i*(bw+gap)
            box(d,x,130,bw,75,name,[port],'HTTP')
            arrow(d,w/2,248,x+bw/2,205)
        box(d,0,0,w*.72,83,'PostgreSQL 17',['stores | catalog | inventory | orders','Uma instância, schemas por domínio','Host 5433; volume commerce-data'],'armazenamento')
        box(d,w*.75,0,w*.25,83,'Gemini',['Provedor externo','Via Mastra'],'API')
        for i in range(4): arrow(d,i*(bw+gap)+bw/2,130,min(i*(bw+gap)+bw/2,w*.69),83)
        arrow(d,4*(bw+gap)+bw/2,130,w*.87,83)
        return d, 'Implantação e dependências principais. Chamadas entre domínios usam HTTP; o framework é biblioteca de lojas e pedidos.'
    raise ValueError(key)


class Report(BaseDocTemplate):
    def __init__(self, path):
        super().__init__(str(path), pagesize=A4, leftMargin=3*cm,rightMargin=2*cm,topMargin=2.5*cm,bottomMargin=2.2*cm,
                         title=REPORT_TITLE, author=REPORT_AUTHOR,pageCompression=1)
        frame=Frame(self.leftMargin,self.bottomMargin,self.width,self.height,id='normal',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
        self.addPageTemplates(PageTemplate(id='page',frames=frame,onPage=self.page))
        self.headings=[]

    def page(self,canvas,doc):
        canvas.saveState()
        if doc.page>1:
            canvas.setFont('Body',9)
            canvas.drawCentredString(A4[0]/2,1.2*cm,str(doc.page))
        canvas.restoreState()

    def afterFlowable(self,flowable):
        if isinstance(flowable,Paragraph) and getattr(flowable,'toc_level',None) is not None:
            level=flowable.toc_level
            name='h'+hashlib.sha1(flowable.getPlainText().encode()).hexdigest()[:15]
            self.canv.bookmarkPage(name)
            self.canv.addOutlineEntry(flowable.getPlainText(),name,level=level,closed=False)
            self.notify('TOCEntry',(level,flowable.getPlainText(),self.page,name))
            self.headings.append((flowable.getPlainText(),self.page))


class CodeBlock(Preformatted):
    def draw(self):
        tx=self.canv.beginText(self.style.leftIndent,self.height-self.style.fontSize)
        tx.setLeading(self.style.leading)
        self.canv.setFillColor(self.style.textColor or colors.black)
        for line in self.lines:
            for part in re.split(r'([\u2318\u25a7\u2733])',line):
                tx.setFont('GlyphFallback' if part in ['⌘','▧','✳'] else self.style.fontName,self.style.fontSize,self.style.leading)
                tx.textOut(part)
            tx.textLine('')
        self.canv.drawText(tx)

    def split(self, availWidth, availHeight):
        fit = int(availHeight / self.style.leading)
        if fit < 5:
            return []
        rest = len(self.lines) - fit
        if 0 < rest < 5:
            fit -= 5 - rest
        if fit < 5:
            return []
        return [CodeBlock('\n'.join(self.lines[:fit]), self.style),
                CodeBlock('\n'.join(self.lines[fit:]), self.style)]


class ImageViewport(Flowable):
    """Recorte de diagramação: mantém intacta a captura original em disco."""
    def __init__(self,path,crop,maxheight):
        super().__init__()
        self.path=path
        self.crop=crop
        x,y,w,h=crop
        self.scale=min(WIDTH/w,maxheight/h)
        self.width=w*self.scale
        self.height=h*self.scale
        self.hAlign='CENTER'

    def draw(self):
        x,y,w,h=self.crop
        with PILImage.open(self.path) as im: iw,ih=im.size
        c=self.canv
        c.saveState()
        p=c.beginPath();p.rect(0,0,self.width,self.height)
        c.clipPath(p,stroke=0,fill=0)
        c.drawImage(ImageReader(str(self.path)),-x*self.scale,(y+h-ih)*self.scale,
                    width=iw*self.scale,height=ih*self.scale,mask='auto')
        c.restoreState()


def code_blocks(code,style):
    # Wrap to the measured line width without dropping a source character.
    lines=[]
    for line in code.expandtabs(2).splitlines():
        if not line:
            lines.append(''); continue
        chunks=textwrap.wrap(line,width=94,expand_tabs=False,replace_whitespace=False,drop_whitespace=False,break_long_words=True,break_on_hyphens=False)
        lines.extend(chunks or [''])
    return CodeBlock('\n'.join(lines),style)


def make_pdf(text):
    setup_fonts()
    base=ParagraphStyle('Body',fontName='Body',fontSize=11.5,leading=16.7,alignment=TA_JUSTIFY,spaceAfter=8,splitLongWords=True,allowWidows=0,allowOrphans=0)
    styles={
      'body':base,
      'reference':ParagraphStyle('Reference',parent=base,fontSize=11,leading=15.4,spaceAfter=7,alignment=TA_LEFT),
      'h1':ParagraphStyle('H1',parent=base,fontName='Body-Bold',fontSize=15,leading=19,spaceBefore=15,spaceAfter=12,alignment=TA_LEFT,keepWithNext=True),
      'h2':ParagraphStyle('H2',parent=base,fontName='Body-Bold',fontSize=12.4,leading=16,spaceBefore=12,spaceAfter=8,alignment=TA_LEFT,keepWithNext=True),
      'h3':ParagraphStyle('H3',parent=base,fontName='Body-Bold',fontSize=11.7,leading=15.8,spaceBefore=11,spaceAfter=7,alignment=TA_LEFT,keepWithNext=True),
      'caption':ParagraphStyle('Caption',parent=base,fontSize=9.4,leading=12,alignment=TA_CENTER,spaceAfter=10),
      'code':ParagraphStyle('Code',fontName='Mono',fontSize=8.1,leading=10.4,spaceBefore=5,spaceAfter=10,leftIndent=0),
      'cell':ParagraphStyle('Cell',fontName='Body',fontSize=9.8,leading=12.7,spaceAfter=0,splitLongWords=True),
      'headcell':ParagraphStyle('HeadCell',fontName='Body-Bold',fontSize=9.8,leading=12.7,spaceAfter=0),
    }
    story=[]
    centered=ParagraphStyle('Cover',parent=base,alignment=TA_CENTER,spaceAfter=10)
    logo=FIGURES/'ufal.png'
    with PILImage.open(logo) as im: iw,ih=im.size
    story.append(Spacer(1,1.3*cm))
    story.append(Image(str(logo),width=3.2*cm,height=3.2*cm*ih/iw,hAlign='CENTER'))
    story.append(Spacer(1,.6*cm))
    for line in ['UNIVERSIDADE FEDERAL DE ALAGOAS','INSTITUTO DE COMPUTAÇÃO']:
        story.append(Paragraph(line,centered))
    story.append(Spacer(1,1.4*cm))
    story.append(Paragraph('Gerar Commerce',ParagraphStyle('Title',parent=centered,fontName='Body-Bold',fontSize=19,leading=24)))
    story.append(Paragraph(COVER_SUBTITLE,ParagraphStyle('Subtitle',parent=centered,fontName='Body-Bold',fontSize=15,leading=20)))
    story.append(Spacer(1,.7*cm))
    story.append(Paragraph(COVER_COURSE,centered))
    story.append(Spacer(1,.7*cm))
    story.append(Paragraph(COVER_AUTHORS,centered))
    story.append(Spacer(1,.5*cm))
    repository_style=ParagraphStyle('RepositoryCover',parent=centered,fontSize=10.5,leading=14,spaceAfter=4)
    story.append(Paragraph('Repositório do projeto',repository_style))
    story.append(Paragraph(f'<link href="{REPOSITORY}" color="#222222"><u>{REPOSITORY}</u></link>',repository_style))
    story.append(Spacer(1,1.2*cm))
    story.append(Paragraph('Maceió<br/>2026',centered))
    story.append(PageBreak())
    story.append(Paragraph('Sumário',styles['h1']))
    story.append(Paragraph(f'Repositório: <link href="{REPOSITORY}" color="#222222"><u>{REPOSITORY}</u></link>',ParagraphStyle('RepositoryTOC',parent=base,fontSize=10,leading=14,alignment=TA_LEFT,spaceAfter=12)))
    toc=TableOfContents()
    toc.levelStyles=[ParagraphStyle('toc0',fontName='Body-Bold',fontSize=11,leading=15,leftIndent=0,firstLineIndent=0,spaceBefore=5),ParagraphStyle('toc1',fontName='Body',fontSize=10.3,leading=14,leftIndent=14,firstLineIndent=0)]
    story.append(toc)
    story.append(PageBreak())
    lines=text.splitlines()
    start=next(i for i,l in enumerate(lines) if l.startswith('## 1 '))
    lines=lines[start:]
    i=0; figure=0;references=False
    while i<len(lines):
        line=lines[i].strip()
        if not line: i+=1; continue
        if line.startswith('```'):
            code=[]; i+=1
            while i<len(lines) and not lines[i].startswith('```'):
                code.append(lines[i]); i+=1
            story.append(code_blocks('\n'.join(code),styles['code']))
            i+=1; continue
        if line.startswith('## '):
            title=line[3:]
            references=title.startswith(REFERENCE_SECTION+' ')
            if title.startswith('Apêndice'):
                story.append(PageBreak())
            else: story.append(CondPageBreak(125))
            p=Paragraph(rich(title),styles['h1']); p.toc_level=0
            story.append(p); i+=1; continue
        if line.startswith('### '):
            title=line[4:]
            if re.match(r'[AB]\.\d+ ',title): story.append(CondPageBreak(200))
            p=Paragraph(rich(title),styles['h2']); p.toc_level=1
            story.append(p); i+=1;continue
        if line.startswith('#### '):
            story.append(Paragraph(rich(line[5:]),styles['h3']));i+=1;continue
        if line.startswith('{{diagram:'):
            key=line[len('{{diagram:'):-2]
            d,caption=diagram(key); figure+=1
            headings=[]
            while story and isinstance(story[-1],Paragraph) and getattr(story[-1],'toc_level',None) is not None:
                headings.insert(0,story.pop())
            story.append(KeepTogether(headings+[d,Spacer(1,6),Paragraph(f'Figura {figure} - {escape(caption)}<br/>Fonte: elaboração própria a partir do código do projeto.',styles['caption'])]))
            i+=1;continue
        if line.startswith('{{image:'):
            file,caption,maxheight=line[len('{{image:'):-2].split('|')
            path=FIGURES/file
            with PILImage.open(path) as im: iw,ih=im.size
            scale=min(WIDTH/iw,float(maxheight)/ih)
            figure+=1
            visual = ImageViewport(path,IMAGE_CROPS[file],float(maxheight)) if file in IMAGE_CROPS else Image(str(path),width=iw*scale,height=ih*scale,hAlign='CENTER')
            headings=[]
            while story and isinstance(story[-1],Paragraph) and getattr(story[-1],'toc_level',None) is not None:
                headings.insert(0,story.pop())
            story.append(KeepTogether(headings+[visual,Spacer(1,6),Paragraph(f'Figura {figure} - {escape(caption)}<br/>Fonte: captura da aplicação com dados fictícios.',styles['caption'])]))
            i+=1; continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                row=[c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?',c) for c in row): rows.append(row)
                i+=1
            n=len(rows[0])
            if n==5: widths=[48,WIDTH-48-25-36-69,25,36,69]
            elif n==2: widths=[WIDTH*.43,WIDTH*.57]
            elif n==3: widths=[WIDTH*.24,WIDTH*.31,WIDTH*.45]
            elif n==4: widths=[WIDTH*.18,WIDTH*.25,WIDTH*.25,WIDTH*.32]
            else: widths=[WIDTH/n]*n
            data=[[Paragraph(rich(c),styles['headcell'] if r==0 else styles['cell']) for c in row] for r,row in enumerate(rows)]
            table=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
            table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eeeeee')),('LINEBELOW',(0,0),(-1,0),.6,colors.black),('LINEBELOW',(0,1),(-1,-1),.25,colors.HexColor('#cccccc')),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
            story.extend([table,Spacer(1,9)]);continue
        paragraph=[line];i+=1
        while i<len(lines) and lines[i].strip() and not lines[i].startswith(('##','```','|','{{')):
            paragraph.append(lines[i].strip());i+=1
        story.append(Paragraph(rich(' '.join(paragraph)),styles['reference'] if references else styles['body']))
    doc=Report(OUT)
    doc.multiBuild(story)
    manifest=json.loads((HERE/'fontes.json').read_text(encoding='utf8'))
    manifest['pdf']={'pages':len(PdfReader(OUT).pages),'sha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),'figures':figure}
    (HERE/'fontes.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps(manifest['pdf'],ensure_ascii=False))

    number=0
    def markdown_figure(match):
        nonlocal number
        number+=1
        kind,value=match.group(1),match.group(2)
        if kind=='diagram':
            d,caption=diagram(value)
            file=f'diagrama-{value}.svg'
            renderSVG.drawToFile(d,str(FIGURES/file))
        else:
            file,caption,_=value.split('|')
        return f'![{caption}]({FIGURES_RELATIVE}/{file})\n\nFigura {number} - {caption}'
    expanded=re.sub(r'\{\{(diagram|image):(.*?)\}\}',markdown_figure,text)
    MARKDOWN_OUT.write_text(expanded.rstrip()+'\n',encoding='utf8')


if __name__=='__main__':
    make_pdf(expand_source())
