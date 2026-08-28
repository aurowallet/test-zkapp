import { Field, SmartContract, state, State, method } from "o1js-mesa";

// This contract must remain isolated from AddBerkeley: it is compiled by o1js-mesa
// and therefore produces Mesa's 32-state zkApp command shape.
export class AddMesa extends SmartContract {
  @state(Field) num = State<Field>();

  init() {
    super.init();
    this.num.set(Field(1));
  }

  @method async update() {
    const currentState = this.num.getAndRequireEquals();
    this.num.set(currentState.add(2));
  }

  @method async setValue(value: Field) {
    this.num.set(value);
  }
}
