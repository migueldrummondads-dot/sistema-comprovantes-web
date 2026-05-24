import os
import re
import shutil
import zipfile
import pdfplumber

from PyPDF2 import (
    PdfReader,
    PdfWriter
)

from werkzeug.utils import secure_filename

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    send_from_directory
)

from flask_sqlalchemy import SQLAlchemy

from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    logout_user,
    login_required,
    current_user
)

# ==========================================
# CONFIGURAÇÃO
# ==========================================

app = Flask(__name__)

BASE_DIR = os.path.abspath(
    os.path.dirname(__file__)
)

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "static",
    "uploads"
)

SAIDA_FOLDER = os.path.join(
    BASE_DIR,
    "static",
    "saida"
)

TEMP_FOLDER = os.path.join(
    BASE_DIR,
    "temp"
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

os.makedirs(
    SAIDA_FOLDER,
    exist_ok=True
)

os.makedirs(
    TEMP_FOLDER,
    exist_ok=True
)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

app.config["SECRET_KEY"] = (
    "grupo_rcr_2026_secure"
)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    "sqlite:///database.db"
)

app.config[
    "SQLALCHEMY_TRACK_MODIFICATIONS"
] = False

db = SQLAlchemy(app)

# ==========================================
# LOGIN MANAGER
# ==========================================

login_manager = LoginManager()

login_manager.init_app(app)

login_manager.login_view = "login"

# ==========================================
# USUÁRIOS
# ==========================================

class User(UserMixin, db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    username = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(200),
        nullable=False
    )

    admin = db.Column(
        db.Boolean,
        default=False
    )

# ==========================================
# CARREGAR USUÁRIO
# ==========================================

@login_manager.user_loader
def load_user(user_id):

    return User.query.get(
        int(user_id)
    )

# ==========================================
# PADRÕES DE NOMES
# ==========================================

padroes_nome = [

    r"(?:Funcion[áa]rio[s]?\s*:\s*)([A-Z\s]+)",

    r"(?:Nome\s*:\s*)([A-Z\s]+)",

    r"(?:Nome\s*do\s*favorecid[oa]\s*:\s*)([A-Z\s]+)",

    r"(?:Nome\s*do\s*destinat[áa]rio\s*:\s*)([A-Z\s]+)",

    r"(?:Titular\s*:\s*)([A-Z\s]+)",

    r"(?:Cliente\s*:\s*)([A-Z\s]+)"

]

# ==========================================
# LIMPAR NOME
# ==========================================

def limpar_nome(nome):

    if not nome:

        return "SEM_NOME"

    nome = nome.strip().upper()

    nome = re.sub(
        r"\bCPF\b.*",
        "",
        nome
    )

    nome = re.sub(
        r'[\\/*?:"<>|]',
        "",
        nome
    )

    nome = re.sub(
        r"[^A-Z\s]",
        "",
        nome
    )

    nome = re.sub(
        r"\s+",
        " ",
        nome
    ).strip()

    return nome

# ==========================================
# EXTRAIR NOME PDF
# ==========================================

def extrair_nome(pdf_path):

    try:

        with pdfplumber.open(pdf_path) as pdf:

            texto = ""

            for pagina in pdf.pages:

                texto += (
                    pagina.extract_text() or ""
                ) + "\n"

        for padrao in padroes_nome:

            match = re.search(
                padrao,
                texto,
                re.IGNORECASE
            )

            if match:

                return limpar_nome(
                    match.group(1)
                )

    except Exception as erro:

        print(erro)

    return "SEM_NOME"

# ==========================================
# SEPARAR PÁGINAS
# ==========================================

def separar_paginas(pdf_path):

    reader = PdfReader(pdf_path)

    paginas = []

    for i, pagina in enumerate(
        reader.pages
    ):

        writer = PdfWriter()

        writer.add_page(
            pagina
        )

        caminho = os.path.join(
            TEMP_FOLDER,
            f"pagina_{i+1}.pdf"
        )

        with open(
            caminho,
            "wb"
        ) as f:

            writer.write(f)

        paginas.append(caminho)

    return paginas

# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():

    if current_user.is_authenticated:

        return redirect(
            url_for("dashboard")
        )

    return redirect(
        url_for("login")
    )

# ==========================================
# LOGIN
# ==========================================

@app.route(
    "/login",
    methods=["GET", "POST"]
)

def login():

    if current_user.is_authenticated:

        return redirect(
            url_for("dashboard")
        )

    erro = None

    if request.method == "POST":

        username = request.form.get(
            "username"
        )

        password = request.form.get(
            "password"
        )

        user = User.query.filter_by(
            username=username
        ).first()

        if user and check_password_hash(
            user.password,
            password
        ):

            login_user(user)

            return redirect(
                url_for("dashboard")
            )

        else:

            erro = (
                "Usuário ou senha inválidos"
            )

    return render_template(
        "login.html",
        erro=erro
    )

# ==========================================
# DASHBOARD
# ==========================================

@app.route("/dashboard")
@login_required
def dashboard():

    try:

        arquivos = [

            arquivo for arquivo in os.listdir(
                SAIDA_FOLDER
            )

            if arquivo.lower().endswith(".pdf")

        ]

    except:

        arquivos = []

    total_pdfs = len(
        arquivos
    )

    total_usuarios = User.query.count()

    ultimos = arquivos[-5:]

    return render_template(

        "dashboard.html",

        usuario=current_user.username,

        arquivos=arquivos,

        total=total_pdfs,

        total_usuarios=total_usuarios,

        ultimos=ultimos
    )

# ==========================================
# UPLOAD PDFs
# ==========================================

@app.route(
    "/upload",
    methods=["POST"]
)

@login_required
def upload_pdf():

    arquivos = request.files.getlist(
        "pdfs"
    )

    for arquivo in arquivos:

        if arquivo.filename == "":

            continue

        nome_arquivo = secure_filename(
            arquivo.filename
        )

        caminho_pdf = os.path.join(
            UPLOAD_FOLDER,
            nome_arquivo
        )

        arquivo.save(
            caminho_pdf
        )

        paginas = separar_paginas(
            caminho_pdf
        )

        for pagina in paginas:

            nome = extrair_nome(
                pagina
            )

            destino = os.path.join(
                SAIDA_FOLDER,
                f"{nome}.pdf"
            )

            contador = 1

            while os.path.exists(
                destino
            ):

                destino = os.path.join(
                    SAIDA_FOLDER,
                    f"{nome}_{contador}.pdf"
                )

                contador += 1

            shutil.copy2(
                pagina,
                destino
            )

    return redirect(
        url_for("dashboard")
    )

# ==========================================
# LOGOUT
# ==========================================

@app.route("/logout")
@login_required
def logout():

    logout_user()

    return redirect(
        url_for("login")
    )

# ==========================================
# DOWNLOAD PDF
# ==========================================

@app.route("/download/<nome_arquivo>")
@login_required
def download_pdf(nome_arquivo):

    return send_from_directory(

        SAIDA_FOLDER,

        nome_arquivo,

        as_attachment=True
    )

# ==========================================
# VISUALIZAR PDF
# ==========================================

@app.route("/visualizar/<nome_arquivo>")
@login_required
def visualizar_pdf(nome_arquivo):

    return send_from_directory(

        SAIDA_FOLDER,

        nome_arquivo
    )

# ==========================================
# EXCLUIR PDF
# ==========================================

@app.route("/excluir/<nome_arquivo>")
@login_required
def excluir_pdf(nome_arquivo):

    caminho = os.path.join(
        SAIDA_FOLDER,
        nome_arquivo
    )

    if os.path.exists(caminho):

        os.remove(caminho)

    return redirect(
        url_for("dashboard")
    )

# ==========================================
# APAGAR TODOS
# ==========================================

@app.route("/apagar_todos")
@login_required
def apagar_todos():

    arquivos = os.listdir(
        SAIDA_FOLDER
    )

    for arquivo in arquivos:

        caminho = os.path.join(
            SAIDA_FOLDER,
            arquivo
        )

        if os.path.isfile(
            caminho
        ):

            os.remove(caminho)

    return redirect(
        url_for("dashboard")
    )

# ==========================================
# DOWNLOAD TODOS
# ==========================================

@app.route("/download_todos")
@login_required
def download_todos():

    zip_path = os.path.join(
        BASE_DIR,
        "comprovantes.zip"
    )

    with zipfile.ZipFile(

        zip_path,

        "w",

        zipfile.ZIP_DEFLATED

    ) as zipf:

        for arquivo in os.listdir(
            SAIDA_FOLDER
        ):

            caminho_arquivo = os.path.join(
                SAIDA_FOLDER,
                arquivo
            )

            if os.path.isfile(
                caminho_arquivo
            ):

                zipf.write(
                    caminho_arquivo,
                    arquivo
                )

    return send_from_directory(

        BASE_DIR,

        "comprovantes.zip",

        as_attachment=True
    )

# ==========================================
# CRIAR USUÁRIO
# ==========================================

@app.route(
    "/criar_usuario",
    methods=["GET", "POST"]
)

@login_required
def criar_usuario():

    erro = None

    if request.method == "POST":

        username = request.form.get(
            "username"
        )

        password = request.form.get(
            "password"
        )

        usuario_existente = User.query.filter_by(
            username=username
        ).first()

        if usuario_existente:

            erro = "Usuário já existe"

            return render_template(
                "criar_usuario.html",
                erro=erro
            )

        senha_hash = generate_password_hash(
            password
        )

        novo_usuario = User(

            username=username,

            password=senha_hash
        )

        db.session.add(
            novo_usuario
        )

        db.session.commit()

        return redirect(
            url_for("dashboard")
        )

    return render_template(
        "criar_usuario.html",
        erro=erro
    )

# ==========================================
# ALTERAR SENHA
# ==========================================

@app.route(
    "/alterar_senha",
    methods=["GET", "POST"]
)

@login_required
def alterar_senha():

    erro = None

    if request.method == "POST":

        username = request.form.get(
            "username"
        )

        nova_senha = request.form.get(
            "password"
        )

        usuario = User.query.filter_by(
            username=username
        ).first()

        if not usuario:

            erro = "Usuário não encontrado"

            return render_template(
                "alterar_senha.html",
                erro=erro
            )

        usuario.password = generate_password_hash(
            nova_senha
        )

        db.session.commit()

        return redirect(
            url_for("dashboard")
        )

    return render_template(
        "alterar_senha.html",
        erro=erro
    )

# ==========================================
# CRIAR CONTA PÚBLICA
# ==========================================

@app.route(
    "/criar_usuario_publico",
    methods=["GET", "POST"]
)

def criar_usuario_publico():

    erro = None

    if request.method == "POST":

        username = request.form.get(
            "username"
        )

        password = request.form.get(
            "password"
        )

        usuario_existente = User.query.filter_by(
            username=username
        ).first()

        if usuario_existente:

            erro = "Usuário já existe"

            return render_template(
                "criar_usuario.html",
                erro=erro
            )

        senha_hash = generate_password_hash(
            password
        )

        novo_usuario = User(

            username=username,

            password=senha_hash
        )

        db.session.add(
            novo_usuario
        )

        db.session.commit()

        return redirect(
            url_for("login")
        )

    return render_template(
        "criar_usuario.html",
        erro=erro
    )

# ==========================================
# CRIAR BANCO
# ==========================================

with app.app_context():

    db.create_all()

# ==========================================
# EXECUTAR
# ==========================================

# ==========================================
# GERENCIAR USUÁRIOS
# ==========================================

@app.route("/usuarios")
@login_required
def usuarios():

    # BLOQUEIA QUEM NÃO É ADMIN
    if current_user.admin != True:

        return redirect(
            url_for("dashboard")
        )

    lista_usuarios = User.query.all()

    return render_template(
        "usuarios.html",
        usuarios=lista_usuarios
    )

# ==========================================
# EXCLUIR USUÁRIO
# ==========================================

@app.route("/excluir_usuario/<int:id>")
@login_required
def excluir_usuario(id):

    # BLOQUEIA QUEM NÃO É ADMIN
    if current_user.admin != True:

        return redirect(
            url_for("dashboard")
        )

    usuario = User.query.get(id)

    # EVITA EXCLUIR A SI MESMO
    if usuario.id == current_user.id:

        return "Você não pode excluir seu próprio usuário."

    db.session.delete(usuario)

    db.session.commit()

    return redirect(
        url_for("usuarios")
    )

if __name__ == "__main__":

    app.run(
        debug=True
    )