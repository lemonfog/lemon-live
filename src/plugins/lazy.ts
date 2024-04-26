import type { App } from "vue"; 

export const lazy = {
  install(app:App){
    app.directive('lazy',{
      mounted(el,binding){
        el.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41IiBkPSJtMi4yNSAxNS43NWw1LjE1OS01LjE1OWEyLjI1IDIuMjUgMCAwIDEgMy4xODIgMGw1LjE1OSA1LjE1OW0tMS41LTEuNWwxLjQwOS0xLjQwOWEyLjI1IDIuMjUgMCAwIDEgMy4xODIgMGwyLjkwOSAyLjkwOW0tMTggMy43NWgxNi41YTEuNSAxLjUgMCAwIDAgMS41LTEuNVY2YTEuNSAxLjUgMCAwIDAtMS41LTEuNUgzLjc1QTEuNSAxLjUgMCAwIDAgMi4yNSA2djEyYTEuNSAxLjUgMCAwIDAgMS41IDEuNW0xMC41LTExLjI1aC4wMDh2LjAwOGgtLjAwOHptLjM3NSAwYS4zNzUuMzc1IDAgMSAxLS43NSAwYS4zNzUuMzc1IDAgMCAxIC43NSAwIi8+PC9zdmc+'
        const observe = new IntersectionObserver((arr)=>{
          foreach(arr,(i)=>{
            if(i.isIntersecting){
              const img = new Image()
              img.src = binding.value
              img.onload = ()=> el.src = binding.value
              observe.unobserve(i.target)
            }
          })
        })
        observe.observe(el)
      },
    })
  }
}