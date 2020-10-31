import { BindingHandler } from "knockout";

const koko: BindingHandler<string> = {
   init(element: HTMLElement, va) {
      element.innerText = `koko ${va()}`
   }
}

export default koko