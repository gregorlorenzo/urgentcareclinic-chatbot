function sortTableByColumn(table, column, asc = true) {
    const dirModifier = asc ? 1 : -1;
    const tBody = table.tBodies[0]
    const rows = Array.from(tBody.querySelectorAll("tr"))
    
    const sortedRows = rows.sort((a, b) => {
        console.log(a)
        console.log(b)
    })
}

sortTableByColumn(document.querySelector("#appointments-table-tab-content  .table-responsive .table"), 1);
    