import ko from 'knockout'
import { BindingContext, Overlay } from '../../lib/context'
type koko<Value = string[]> = {
	init(element, value: () => Value)

	transformContext<BC extends BindingContext>(input: Value, parentContext: BC): Overlay<BindingContext<Value, BC>, BC>
}
export default koko