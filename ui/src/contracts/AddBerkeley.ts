import { Field, SmartContract, state, State, method } from "o1js-berkeley";

// Keep Berkeley compilation isolated from the Mesa runtime. A zkApp command's
// state-array length is part of what the wallet signs and cannot be converted.
export class AddBerkeley extends SmartContract {
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
