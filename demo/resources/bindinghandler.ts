import ko from 'knockout'
import { BindingContext, ChildBindingContext, Overlay } from '../../lib/resources/context'
type koko<Value = string[]> = {
	init(element, value: () => Value)

	transformContext<BC extends BindingContext<any>>(input: Value, parentContext: BC): Overlay<ChildBindingContext<Value, BC>, BC>
}
export default koko