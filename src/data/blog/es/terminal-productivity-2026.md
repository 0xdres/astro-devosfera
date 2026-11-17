---
title: "Productividad en la terminal: las herramientas que transformaron mi flujo de trabajo"
description: "Un recorrido por las herramientas modernas de línea de comandos que reemplazan a los clásicos de Unix: más rápidas, inteligentes y con mejor DX."
pubDatetime: 2026-01-18T10:00:00Z
tags:
  - terminal
  - productividad
  - linux
  - cli
  - herramientas
draft: false
---

El ecosistema de la CLI experimentó una revolución silenciosa. Herramientas escritas en Rust y Go reemplazaron binarios de Unix con décadas de antigüedad, agregando colores, resaltado de sintaxis, búsqueda difusa (fuzzy search) e integración con Git casi sin sacrificar velocidad. Estas son las que uso a diario.

## Shell: Zsh + Starship

[Starship](https://starship.rs) es sin duda el prompt que más mejora la experiencia con el menor esfuerzo. Funciona con cualquier shell, es increíblemente rápido (escrito en Rust) y muestra contexto relevante: rama de Git, versión de Node/Python/Rust, estado del último comando.

```toml file=~/.config/starship.toml
# Minimalist but informative style
format = """
$directory\
$git_branch\
$git_status\
$nodejs\
$rust\
$python\
$cmd_duration\
$line_break\
$character"""

[git_branch]
symbol = " "
style = "bold purple"

[git_status]
conflicted = "⚔️ "
ahead = "⇡${count}"
behind = "⇣${count}"
modified = "✎${count}"
untracked = "?${count}"

[cmd_duration]
min_time = 2_000
format = "took [$duration](bold yellow)"
```

## Reemplazos de herramientas clásicas

### `ls` → `eza` (antes `exa`)

```bash
eza --tree --level=2 --icons --git    # tree with icons and Git status
eza -la --sort=modified               # long list, sorted by date
```

### `find` → `fd`

```bash
# find: verbose and poor ergonomics
find . -name "*.ts" -not -path "*/node_modules/*"    # [!code --]

# fd: intuitive, respects .gitignore by default
fd -e ts                    # all .ts in the project          # [!code ++]
fd -e ts --exec bat {}      # open each result with bat       # [!code ++]
```

### `grep` → `ripgrep` (`rg`)

```bash
# classic grep
grep -r "useEffect" src/ --include="*.tsx"      # [!code --]

# rg: 5-10× faster, respects .gitignore
rg "useEffect" --type ts                         # [!code ++]
rg "TODO|FIXME|HACK" --type ts --stats           # [!code ++]
rg "deprecated" -l                               # filenames only # [!code ++]
```

### `cat` → `bat`

`bat` es `cat` con resaltado de sintaxis, números de línea, paginación y diff de Git integrado:

```bash
bat src/components/Header.astro     # with colors and lines
bat --diff file.ts                  # shows inline Git changes
```

### `cd` → `zoxide`

Aprende qué directorios visitas con frecuencia y te permite saltar a ellos con unas pocas letras:

```bash
z astro      # jumps to ~/projects/my-astro-blog if it's the most visited
z blog src   # multiple match
zi           # interactive mode with fzf
```

## Multiplexor: `tmux` con configuración moderna

```bash file=~/.tmux.conf
# More comfortable prefix
set -g prefix C-a
unbind C-b

# Split panes with intuitive keys
bind | split-window -h -c "#{pane_current_path}"  # [!code highlight]
bind - split-window -v -c "#{pane_current_path}"  # [!code highlight]

# Navigation with Alt+arrow (no prefix)
bind -n M-Left  select-pane -L
bind -n M-Right select-pane -R
bind -n M-Up    select-pane -U
bind -n M-Down  select-pane -D

# Mouse enabled
set -g mouse on

# 256 colors
set -g default-terminal "tmux-256color"
```

## Fuzzy finder: `fzf` — el multiplicador de todo

`fzf` convierte cualquier lista en un buscador interactivo. Solo agrega `| fzf` a cualquier comando.

```bash
# Search in command history
CTRL+R with integrated fzf

# Checkout branch with preview
git branch | fzf --preview 'git log --oneline {}' | xargs git checkout

# Kill processes
ps aux | fzf --multi | awk '{print $2}' | xargs kill

# Find and open file
fd -e ts | fzf --preview 'bat --color=always {}' | xargs nvim
```

## Git moderno: `lazygit`

Una TUI (Terminal UI) para Git que hace que sea obvio lo que está sucediendo en tu repositorio:

```bash
lazygit   # opens the interface
```

Características destacadas:

- Ver diffs por archivo y por línea
- Stage selectivo (líneas individuales, no solo archivos)
- Resolver conflictos visualmente
- Rebase interactivo con arrastrar y soltar (drag & drop)

## Mi `.zshrc` básico optimizado

```bash file=~/.zshrc
# Fast load with lazy loading
export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"

# Modern aliases
alias ls='eza --icons'
alias ll='eza -la --icons --git'
alias tree='eza --tree --icons'
alias cat='bat'
alias find='fd'
alias grep='rg'
alias lg='lazygit'

# fzf integration
source <(fzf --zsh)

# zoxide
eval "$(zoxide init zsh)"

# starship
eval "$(starship init zsh)"
```

> La mejor inversión de tiempo en productividad de terminal no es aprender nuevas herramientas, sino dominar las que ya tienes. Pero cuando una herramienta moderna hace lo mismo 5 veces más rápido con mejor DX, el cambio se paga solo en la primera semana.
