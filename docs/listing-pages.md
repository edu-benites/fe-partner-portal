# Padrão de Listagens

As telas de listagem do portal devem usar os componentes em `src/components/ListPage`.

## Composição

Use `ListPage` como contêiner principal. Ele padroniza o cabeçalho, o título, a descrição e as ações da tela.

Use `ListToolbar` para filtros, `StatusTabs` para alternância de status, `ListCard` para envolver a tabela e `ListPagination` para paginação server-side.

```jsx
<ListPage eyebrow="Gestão" title="Nova tela" description="Consulte os registros." actions={<ExportButtons ... />}>
  <StatusTabs items={statuses} value={status} onChange={setStatus} />
  <ListToolbar>{/* filtros */}</ListToolbar>
  <ListCard title="Registros" count={rows.length}>
    {/* tabela, loading, erro ou estado vazio */}
    <ListPagination page={page} totalPages={totalPages} onPageChange={loadPage} />
  </ListCard>
</ListPage>
```

Regras do padrão:

- A API deve ser consultada com paginação server-side.
- Filtros devem ficar dentro de `ListToolbar`.
- A tabela deve tratar loading, erro e estado vazio.
- Ações de exportação e widget devem ficar no cabeçalho, em `actions`.
- Use `StatusTabs` quando a listagem tiver estados mutuamente exclusivos.
- Mantenha o CNPJ e o `Authorization` no fluxo do BFF, nunca no bundle do frontend.
