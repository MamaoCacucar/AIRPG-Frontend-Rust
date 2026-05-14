# AI INSTRUCTIONS: FRONTEND & RUST GUIDELINES

## ESTRUTURA DO REPOSITÓRIO
```plaintext
AIRPG-Frontend-Rust/
├── src-ui/         
│   ├───assets                # Imagens, fontes e outros recursos estáticos
│   │   ├───icons             # Ícones usados na interface 
│   │   └───templates         # Imagens Templates de UI
│   ├───pages                 # Telas principais separados em subpastas
│   │   └───menu              # Subpasta raiz da tela (substituir pelo nome da tela)
│   │       ├───components    # Componentes individuais da tela (PascalCase)
│   │       └───hooks         # hooks individuais da tela (PascalCase)
│   ├───services              # API + serviços (kebab-case)
│   ├───shared                # Componentes e hooks compartilhados entre diferentes telas
│   │   ├───components        # Componentes reutilizáveis (PascalCase)
│   │   └───hooks             # hooks reutilizáveis (PascalCase)
│   └───utils                 # Helpers (kebab-case)
├── src-tauri/            # (Maestro) Rust, VRAM Optimizer, File I/O, IPC
├── package.json          # Dependências do Frontend
└── docs/                         # Documentação do Projeto
    ├── ai_instructions.md        # Diretrizes para IAs (Abaixo)
    ├── readme.md                 # Visão Geral
    └── backlog.md                # Requisitos
```

## 1. PADRÃO DE PROJETO (RUST)
- **Estrutura:** O código Rust deve residir em `src`. Use módulos separados para `vram`, `logger`, `fs_manager` e `commands`.
- **Error Handling:** Nunca use `unwrap()`. Utilize o padrão `Result<T, Error>` e mapeie erros para strings que o Tauri possa retornar para o Frontend.
- **Segurança de Memória:** Utilize `Arc<Mutex<T>>` ou `State` do Tauri para gerenciar o estado global (como o caminho da campanha ativa) entre diferentes threads.

## 2. INTEGRAÇÃO REACT -> TAURI
- Todas as chamadas ao backend Rust devem ser feitas através do `invoke` do Tauri.
- **Exemplo de Fluxo:**
  1. Usuário digita `/save`.
  2. React chama `invoke("handle_command", { input: "/save" })`.
  3. Rust identifica o comando, executa a escrita no disco e retorna `Success`.
  4. React atualiza o HUD de logs.

## 3. CONVENÇÕES DO FRONTEND (JSX)
- **Reutilização e Componentização:** Evite ao máximo a duplicação de código. Crie componentes isolados e utilize **Hooks** customizados para extrair qualquer lógica reutilizável.
- **CSS Modules e Temas:** O projeto adota estritamente a abordagem de CSS Modules (`.module.css`). Utilize sempre **variáveis de CSS** para o tema (cores, backgrounds, fontes — ex: `var(--text-primary)`, `var(--font-title)`) para facilitar a troca dinâmica de skins da campanha.
- **Unidades Responsivas:** É obrigatório o uso de unidades de medida responsivas e relativas (como `rem`, `em`, `vh`, `vw`, `%`). A estilização deve se adaptar dinamicamente, portanto, **evite o uso de `px`** (como visto no padrão do projeto, onde margens, paddings e fontes usam `rem`).
- **Proibições Estritas (NÃO UTILIZAR):**
  - **Tailwind CSS:** O uso de classes utilitárias do Tailwind é estritamente proibido (o framework está em processo de remoção do projeto).
  - **Inline Styles:** Nunca utilize estilos inline (ex: `style={{ color: 'red' }}`). Toda a estilização deve ser feita através das classes do CSS Module.
- **Nomenclatura Semântica:** Nomeie as classes no CSS de forma semântica, baseada no que o elemento é, e não em como ele se parece (ex: `container`, `contentWrapper`, `primaryButton`, `titleMain`).

## 4. GESTÃO DE SIDECAR (PYTHON)
- O código Python (Sidecar) deve ser tratado como uma "Black Box" de processamento.
- O Rust é responsável por garantir que o Sidecar esteja rodando antes de enviar requisições de IA.
- Configurações do `.env` devem ser lidas pelo Rust e passadas como variáveis de ambiente no momento do `spawn` do processo Python.