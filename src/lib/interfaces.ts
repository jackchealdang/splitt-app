interface Item {
  id: number;
  name: string;
  cost: number;
  people: Array<number>;
}

interface Person {
  id: number;
  name: string;
}

interface PersonSubTotal {
  id: number;
  amt: number;
}

interface PersonTip {
  id: number;
  amt: number;
}

interface PersonTax {
  id: number;
  amt: number;
}

export type { Item, Person, PersonSubTotal, PersonTip, PersonTax };
