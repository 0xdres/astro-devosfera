---
title: "Terminal productivity: the tools that transformed my workflow"
description: A tour of modern command-line tools that replace Unix classics — faster, smarter, and with better DX.
pubDatetime: 2026-01-18T10:00:00Z
tags:
  - terminal
  - productivity
  - linux
  - cli
  - tools
draft: false
---

The CLI ecosystem experienced a silent revolution. Tools written in Rust and Go replaced decades-old Unix binaries, adding colors, syntax highlighting, fuzzy search, and Git-awareness with almost no sacrifice in speed. These are the ones I use daily.

## Table of contents

## Shell: Zsh + Starship

[Starship](https://starship.rs) is undoubtedly the prompt that most improves the experience with the least effort. It works with any shell, is incredibly fast (written in Rust) and shows relevant context: Git branch, Node/Python/Rust version, last command status.

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

## Classic tool replacements

### `ls` → `eza` (formerly `exa`)

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

`bat` is `cat` with syntax highlighting, line numbers, paging, and built-in Git diff:

```bash
bat src/components/Header.astro     # with colors and lines
bat --diff file.ts                  # shows inline Git changes
```

### `cd` → `zoxide`

It learns which directories you visit frequently and lets you jump to them with a few letters:

```bash
z astro      # jumps to ~/projects/my-astro-blog if it's the most visited
z blog src   # multiple match
zi           # interactive mode with fzf
```

## Multiplexer: `tmux` with modern config

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

## Fuzzy finder: `fzf` — the multiplier of everything

`fzf` turns any list into an interactive finder. Just add `| fzf` to any command.

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

## Modern Git: `lazygit`

A Git TUI (Terminal UI) that makes it obvious what's happening in your repository:

```bash
lazygit   # opens the interface
```

Standout features:

- View diffs by file and by line
- Selective stage (individual lines, not just files)
- Resolve conflicts visually
- Interactive rebase with drag & drop

## My optimized basic `.zshrc`

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

> The best time investment in terminal productivity is not learning new tools — it's mastering the ones you already have. But when a modern tool does the same thing 5× faster with better DX, the switch pays for itself in the first week.
