function L(c,f){if(c=[...c],Array.isArray(c[0])||(c=c.map(({x:r,y:a})=>[r,a])),f){const a=c[c.length-2],n=c[0],u=c[1];c.unshift(c[c.length-1]),c.unshift(a),c.push(n),c.push(u)}return c.flat()}function O(c=[],f=1,r=!1,a){const n=(c=L(c,r)).length,u=n-4,x=r?c[2]:c[0],y=r?c[3]:c[1];let P="M"+[x,y];a&&a("MOVE",[x,y]);const C=r?n-4:n-2;for(let t=r?2:0;t<C;t+=2){const l=c[t+0],g=c[t+1],e=c[t+2],h=c[t+3],m=l+(e-(t?c[t-2]:c[0]))/6*f,s=g+(h-(t?c[t-1]:c[1]))/6*f,d=e-((t!==u?c[t+4]:e)-l)/6*f,o=h-((t!==u?c[t+5]:h)-g)/6*f;P+="C"+[m,s,d,o,e,h],a&&a("CURVE",[m,s,d,o,e,h])}return P}export{O as spline};