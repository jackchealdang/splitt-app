import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { Separator } from "./ui/separator";
import CurrencyInput from "@/components/ui/currency-input";
import { X, Upload } from "lucide-react";

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

let currentPersonId = 0;
let currentItemId = 0;

function getNextPersonId() {
  currentPersonId = currentPersonId + 1;
  return currentPersonId;
}

function getNextItemId() {
  currentItemId = currentItemId + 1;
  return currentItemId;
}

const initPeople: Array<Person> = [
  {
    id: getNextPersonId(),
    name: "Miso",
  },
  {
    id: getNextPersonId(),
    name: "Maru",
  },
];

const initItems: Array<Item> = [
  {
    id: getNextItemId(),
    name: "Matcha Latte (Large)",
    cost: 10.0,
    people: [],
  },
];

export function Calculator() {
  const [people, setPeople] = useState<Array<Person>>(initPeople);
  const [items, setItems] = useState<Array<Item>>(initItems);
  const [tip, setTip] = useState<number>(1.0);
  const [file, setFile] = useState<File | null>(null);

  async function getPresignedUrl() {
    const response = await fetch(
      `${import.meta.env.PUBLIC_PRESIGNED_ENDPOINT}/generate-presigned-url`,
      {
        method: "POST",
      },
    );
    const data = await response.json();
    return data;
  }

  async function uploadToS3() {
    if (!file) {
      console.log("No file");
      return;
    }
    const { presigned_url, file_key } = await getPresignedUrl();

    await fetch(presigned_url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    return file_key;
  }

  const processReceipt = async (fileKey: string | void) => {
    if (!fileKey) {
      return;
    }
    const response = await fetch(
      `${import.meta.env.PUBLIC_PROCESS_ENDPOINT}/deploy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": import.meta.env.X_API_KEY,
        },
        body: JSON.stringify({
          bucket_name: "splitt-receipts",
          file_key: fileKey,
        }),
      },
    );

    const data = await response.json();
    return data;
  };

  const handleReceiptUpload = async () => {
    const fileKey = await uploadToS3();
    const extractedData = await processReceipt(fileKey);
    let newItems: Array<Item> = [];
    extractedData.items.forEach((item: any) => {
      const newItem: Item = {
        id: getNextItemId(),
        name: item.name,
        cost: item.price,
        people: [],
      };
      newItems.push(newItem);
    });
    setItems(newItems);
    setTax(extractedData.tax);
    setTip(extractedData.tip);
  };

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

  function handleUpdatePersonOnItem(itemId: number, personId: number) {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              people: item.people.includes(personId)
                ? item.people.filter((id) => id !== personId)
                : [...item.people, personId],
            }
          : item,
      ),
    );
  }

  function addPerson() {
    const newPerson: Person = {
      id: getNextPersonId(),
      name: `Person #${currentPersonId}`,
    };
    setPeople((prevPeople) => [...prevPeople, newPerson]);
  }

  function removePerson(id: number) {
    setPeople(people.filter((person) => person.id !== id));
  }

  function removeItem(id: number) {
    setItems(items.filter((item) => item.id !== id));
  }

  function addItem() {
    const newItem: Item = {
      id: getNextItemId(),
      name: "New item",
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  }

  const totalCostBeforeExtras = items.reduce((sum, item) => sum + item.cost, 0);
  const [tax, setTax] = useState<number>(
    Math.round(0.0825 * totalCostBeforeExtras * 100) / 100,
  );
  const totalCostAfterExtras = totalCostBeforeExtras + tip + tax;

  function calculateAmountsOwed(items: Array<Item>, people: Array<Person>) {
    let amounts: Record<number, number> = {};

    people.forEach((person) => (amounts[person.id] = 0));

    items.forEach((item) => {
      if (item.people.length > 0) {
        const share = item.cost / item.people.length;
        item.people.forEach((personId) => {
          amounts[personId] += share;
        });
      }
    });

    // could possibly move this to somewhere earlier
    if (totalCostBeforeExtras === 0) {
      return amounts;
    }

    Object.keys(amounts).forEach((personId) => {
      const personTotal = amounts[Number(personId)];
      const personTip = (personTotal / totalCostBeforeExtras) * tip;
      const personTax = (personTotal / totalCostBeforeExtras) * tax;
      amounts[Number(personId)] += personTip + personTax;
    });

    return amounts;
  }

  const amountsOwed = calculateAmountsOwed(items, people);

  return (
    <div>
      <Card className="hover:shadow-md w-[24rem] h-min-[32rem] transition-all ease-in duration-100">
        <CardHeader>
          <CardTitle>
            <p className="text-lg">Splitt</p>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-y-2">
            <Button className="w-fit bg-blue-500" onClick={addPerson}>
              Add a person
            </Button>
            {people.map((person, index) => (
              <div className="flex justify-between items-center">
                <div className="flex w-min items-center gap-x-1">
                  <Button
                    className="cursor-pointer w-6 h-6"
                    variant="ghost"
                    onClick={() => removePerson(person.id)}
                  >
                    <X />
                  </Button>
                  <Input
                    type="text"
                    placeholder="Name"
                    value={person.name}
                    key={person.id}
                    onChange={(e) =>
                      handleUpdatePersonName(person.id, e.target.value)
                    }
                    className="p-0 w-44 border-none outline-none shadow-none focus-visible:ring-0 underline"
                  />
                </div>
                <div className="w-21 flex justify-between">
                  <div>$</div>
                  <div className="text-blue-500 font-bold">
                    {amountsOwed[person.id].toFixed(2)}{" "}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-y-2">
            <Button className="w-fit bg-blue-500" onClick={addItem}>
              Add an item
            </Button>
            {items.map((item) => (
              <div>
                <div className="flex w-full justify-between items-center">
                  <div className="flex w-min items-center gap-x-1">
                    <Button
                      className="cursor-pointer w-6 h-6"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                    >
                      <X />
                    </Button>
                    <Input
                      type="text"
                      placeholder="Item"
                      value={item.name}
                      key={item.id}
                      onChange={(e) =>
                        handleUpdateItemName(item.id, e.target.value)
                      }
                      className="p-0 w-44 border-none outline-none shadow-none focus-visible:ring-0 underline"
                    />
                  </div>
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
                <div className="flex flex-wrap gap-2">
                  {people.map((person) => (
                    <Button
                      className={`w-fit px-2 cursor-pointer text-xs ${person.name === "" ? "text-gray-400" : ""}`}
                      variant={
                        item.people.includes(person.id) ? "default" : "outline"
                      }
                      onClick={() =>
                        handleUpdatePersonOnItem(item.id, person.id)
                      }
                    >
                      {person.name ? person.name : "Name"}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-y-2">
            <div className="flex justify-between items-center">
              <div>Add Tax</div>
              <CurrencyInput className="w-24" value={tax} onChange={setTax} />
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-y-2">
            {/* <Button className="w-fit bg-blue-500">Add tip</Button> */}
            <div className="flex justify-between items-center">
              <div>Add Tip</div>
              <CurrencyInput className="w-24" value={tip} onChange={setTip} />
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col">
            <div className="flex justify-between">
              <p>Subtotal</p>
              <div className="w-21 flex justify-between">
                <div>$</div>
                <p>{totalCostBeforeExtras.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex justify-between">
              <p>Tax</p>
              <div className="w-21 flex justify-between">
                <div>$</div>
                <p>{tax.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex justify-between">
              <p>Tip</p>
              <div className="w-21 flex justify-between">
                <div>$</div>
                <p>{tip.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex justify-between">
              <p>Total</p>
              <div className="w-21 flex justify-between">
                <div>$</div>
                <p>{totalCostAfterExtras.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex">
            <Input type="file" onChange={handleFileChange} />
            <Button onClick={() => handleReceiptUpload()}>
              <Upload />
            </Button>
          </div>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
    </div>
  );
}
