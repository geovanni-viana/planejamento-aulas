# Planejamento de Aulas — Laboratório de Informática Magnante

PWA para professoras criarem **fichas de planejamento de aula** para as aulas no laboratório de informática, com vínculo opcional aos horários já cadastrados no **Agenda Lab**.

## Como funciona a integração com o Agenda Lab

Os dois apps são feitos para serem publicados no **mesmo domínio do GitHub Pages** (`https://geovanni-viana.github.io/`), cada um em uma pasta/repositório diferente — por exemplo `.../agendamento-lab/` e `.../planejamento-aulas/`. Como é o mesmo domínio, o `localStorage` é **compartilhado entre os dois apps**, mesmo estando em repositórios separados.

Por causa disso:

- Este app **lê** a chave `lab_agendamentos_v1` (agendamentos avulsos do Agenda Lab) — mas nunca escreve nela.
- A grade fixa semanal (`horarioFixo`) vem de `js/config.js`, que é uma **cópia** do `config.js` do Agenda Lab. **Se você editar os horários fixos no Agenda Lab, replique a mudança aqui também**, ou os dois apps podem mostrar grades diferentes.
- Ao criar/editar uma ficha, a professora pode clicar em "Vincular a um horário", escolher uma data, e o app mostra as aulas daquele dia (fixas + avulsas) puxadas do Agenda Lab, para escolher a qual a ficha se refere.
- Uma ficha também pode ficar **sem vínculo** (rascunho) — útil para planejar antes mesmo de ter um horário confirmado.

> Se algum dia os dois apps forem publicados em domínios diferentes, essa integração por `localStorage` deixa de funcionar automaticamente — nesse caso seria necessário migrar para um backend compartilhado (ex.: Firebase), como já é possível pela camada `storage.js`.

## Funcionalidades

- Ficha de planejamento com: tema da aula, disciplina, turma, habilidade BNCC (opcional), objetivos, conteúdo, metodologia/etapas, recursos necessários, avaliação e observações.
- Vínculo opcional a um horário do Agenda Lab (fixo ou avulso), com preenchimento automático de disciplina/turma.
- Catálogo de fichas com busca e filtro por status (todas / vinculadas / rascunhos).
- Duplicar ficha (útil para reaproveitar um plano em outra turma/data).
- Modo claro/escuro (usa a mesma preferência salva do Agenda Lab, chave `lab_tema`).
- Instalável como app (PWA) e funciona offline (service worker).

## Estrutura de arquivos

```
planejamento-aulas/
├── index.html
├── manifest.json
├── sw.js
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── config.js      # cópia do config.js do Agenda Lab (dias/períodos/grade fixa)
│   ├── storage.js      # leitura do Agenda Lab + CRUD dos planos (localStorage)
│   └── app.js           # estado, renderização e interações
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-maskable-512.png
    └── apple-touch-icon.png
```

## Armazenamento de dados

As fichas de planejamento ficam no `localStorage` do navegador, na chave `lab_planos_v1`, sem depender de servidor. A camada `js/storage.js` expõe métodos assíncronos (`getAll`, `get`, `add`, `update`, `remove`, `duplicar`) — se um dia for necessário migrar para Firebase/Firestore, basta reescrever essas funções.

## Publicando no GitHub Pages

1. Suba esta pasta para um repositório no GitHub (ex.: `planejamento-aulas`).
2. Em **Settings → Pages**, selecione a branch principal e a raiz (`/`) como origem.
3. O app ficará disponível em `https://geovanni-viana.github.io/planejamento-aulas/`.
4. Confirme que fica no mesmo usuário/domínio do Agenda Lab para a integração por `localStorage` funcionar.
