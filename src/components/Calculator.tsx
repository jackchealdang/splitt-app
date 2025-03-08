import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  useRef,
  useState,
  type ReactElement,
  type ReactHTMLElement,
} from "react";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import CurrencyInput from "@/components/ui/currency-input";

interface Item {
  id: number;
  name: string;
  cost: number;
  people: Array<Person>;
}

interface Person {
  id: number;
  name: string;
}

let personId = 0;
let itemId = 0;

function getNextPersonId() {
  personId = personId + 1;
  return personId;
}

function getNextItemId() {
  personId = personId + 1;
  return personId;
}

export function Calculator() {
  const [people, setPeople] = useState<Array<Person>>([
    {
      id: getNextPersonId(),
      name: "Miso",
    },
    {
      id: getNextPersonId(),
      name: "Maru",
    },
  ]);
  const [items, setItems] = useState<Array<Item>>([
    {
      id: getNextItemId(),
      name: "Cat food",
      cost: 20.0,
      people: [],
    },
  ]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleUpdatePersonName(id: number, newName: string) {
    const updatedPeople = people.map((person) =>
      person.id === id ? { ...person, name: newName } : person,
    );
    setPeople(updatedPeople);
  }

  function handleUpdateItemName(id: number, newName: string) {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, name: newName } : item,
    );
    setItems(updatedItems);
  }

  function addPerson() {
    const newPerson: Person = {
      id: getNextPersonId(),
      name: "New Person",
    };
    setPeople((prevPeople) => [...prevPeople, newPerson]);
  }

  function addItem() {
    const newItem: Item = {
      id: getNextItemId(),
      name: "New Item",
      cost: 0,
      people: [],
    };
    setItems((prevItems) => [...prevItems, newItem]);
  }

  function handleUpdateItemCost(
    itemId: string | number | undefined,
    newCost: number,
  ) {
    if (itemId) {
      setItems(
        items.map((item) =>
          item.id === itemId ? { ...item, cost: newCost } : item,
        ),
      );
    }
  }

  const totalCost = items.reduce((sum, item) => sum + item.cost, 0);

  function setRefElement(el: HTMLInputElement | null) {
    if (!el) return;
    inputRef.current = el;
    console.log("set ref!");
  }

  return (
    <div>
      <Card className="hover:shadow-md w-[32rem] h-min-[32rem] transition-all ease-in duration-100">
        <CardHeader>
          <CardTitle>
            <p className="text-lg">Splitt</p>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-y-2">
            <Button className="w-fit" onClick={addPerson}>
              Add a person
            </Button>
            {people.map((person, index) => (
              <Badge
                key={index}
                variant="outline"
                className="w-fit py-2 px-4 text-sm"
              >
                <Input
                  type="text"
                  placeholder="Name"
                  value={person.name}
                  onChange={(e) =>
                    handleUpdatePersonName(person.id, e.target.value)
                  }
                  className="p-0 w-fit border-none outline-none shadow-none focus-visible:ring-0"
                  ref={(ref) => {
                    index === people.length - 1 && setRefElement(ref);
                  }}
                />
              </Badge>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-y-2">
            <Button className="w-fit" onClick={addItem}>
              Add an item
            </Button>
            {items.map((item) => (
              <div>
                <div className="flex w-full justify-between items-center">
                  {item.name}
                  <div className="flex items-center justify-items-end">
                    <CurrencyInput
                      itemId={item.id}
                      value={item.cost}
                      onChange={handleUpdateItemCost}
                      className="w-24"
                    />
                  </div>
                  {/* <div>${item.cost.toFixed(2)}</div> */}
                </div>
                <div className="flex gap-x-2">
                  {people.map((person) => (
                    <Badge className="w-fit py-1 px-2" variant={"outline"}>
                      {person.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div>
            <p className="text-right">
              <b>Total: </b>${totalCost.toFixed(2)}
            </p>
          </div>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
    </div>
  );
}
