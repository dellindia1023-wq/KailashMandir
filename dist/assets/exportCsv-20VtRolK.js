function p(o,s,r){const t=e=>e.includes(",")||e.includes('"')||e.includes(`
`)?`"${e.replace(/"/g,'""')}"`:e,i=[s.map(t).join(","),...r.map(e=>e.map(t).join(","))].join(`
`),u=new Blob([i],{type:"text/csv;charset=utf-8;"}),c=URL.createObjectURL(u),n=document.createElement("a");n.href=c,n.download=o,n.click(),URL.revokeObjectURL(c)}export{p as e};
