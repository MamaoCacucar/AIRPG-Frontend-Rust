# AI INSTRUCTIONS: FRONTEND & RUST GUIDELINES

## ESTRUTURA DO REPOSITÓRIO
```plaintext
AIRPG-Frontend-Rust/
├── src-ui/                  # (Interface) React, UI, HUD, WebGL Map
├── src/             # (Maestro) Rust, VRAM Optimizer, File I/O, IPC
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

## 3. CONVENÇÕES DO FRONTEND (TSX)
- **Arquitetura de Componentes:** - `components/ui/`: Componentes básicos (Buttons, Inputs).
    - `components/game/`: Componentes de lógica (Terminal, HUD, Map).
    - `hooks/`: Use hooks customizados para interagir com as APIs do Rust (ex: `useVramStatus`).
- **CSS:** Use variáveis de CSS para o tema (cores de fundo, fontes mono) para facilitar a troca de skins da campanha.

## 4. GESTÃO DE SIDECAR (PYTHON)
- O código Python (Sidecar) deve ser tratado como uma "Black Box" de processamento.
- O Rust é responsável por garantir que o Sidecar esteja rodando antes de enviar requisições de IA.
- Configurações do `.env` devem ser lidas pelo Rust e passadas como variáveis de ambiente no momento do `spawn` do processo Python.