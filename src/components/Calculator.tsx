import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Separator } from "./ui/separator";
import CurrencyInput from "@/components/ui/currency-input";
import { X, Upload, RotateCcw, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { BlurFade } from "./magicui/blur-fade";
import { ModeToggle } from "./ModeToggle";
import { motion, spring } from "motion/react";

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

const initPeople: Array<Person> = [];

const initItems: Array<Item> = [];

export function Calculator() {
  const [people, setPeople] = useState<Array<Person>>(initPeople);
  const [items, setItems] = useState<Array<Item>>(initItems);
  const [tip, setTip] = useState<number>(0);
  const [tipPercentage, setTipPercentage] = useState<number>(15);
  const [file, setFile] = useState<File | null>(null);
  const [hasMounted, setHasMounted] = useState(true);
  const fileInputRef = useRef(null);
  let totalCostBeforeExtras = 0;

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
          "X-Api-Key": import.meta.env.PUBLIC_X_API_KEY,
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
    if (!file) {
      toast.error("Please select a receipt to upload.", {
        position: "bottom-center",
      });
      return;
    }
    toast.promise(
      (async () => {
        const fileKey = await uploadToS3();
        const extractedData = await processReceipt(fileKey);
        let newItems: Array<Item> = [];
        setItems([]);
        setHasMounted(false);
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
        // setTip(extractedData.tip);
        adjustFlatTip(extractedData.tip);
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
        setFile(null);
      })(),
      {
        loading: "Processing receipt...",
        success: "Receipt processed successfully!",
        error: "Failed to process receipt. Please try again.",
        duration: 3000,
        position: "bottom-center",
      },
    );
  };

  function handleUpdatePersonName(id: number, newName: string) {
    const updatedPeople = people.map((person) =>
      person.id === id ? { ...person, name: newName } : person,
    );
    setPeople(updatedPeople);
  }

  // const handleUpdateItemName = useCallback((id: number, newName: string) => {
  //   const updatedItems = items.map((item) =>
  //     item.id === id ? { ...item, name: newName } : item,
  //   );
  //   setItems(updatedItems);
  // }, [items])

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
      name: `Person #${people.length + 1}`,
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
    setHasMounted(true);
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

  function clearReceipt() {
    setItems([]);
    setHasMounted(false);
    setPeople([]);
    setTax(0);
    setTip(0);
    setTipPercentage(15);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    setFile(null);
  }

  const handleAdjustTipPercentage = useCallback(
    (amt: number) => {
      const newTipPercentage = Math.trunc(tipPercentage) + amt;
      if (newTipPercentage < 0) {
        return;
      }
      setTipPercentage(newTipPercentage);
      // setTip((newTipPercentage / 100) * totalCostBeforeExtras);
    },
    [tipPercentage],
  );

  function adjustTipPercentage(amt: number) {
    const newTipPercentage = Math.trunc(tipPercentage) + amt;
    if (newTipPercentage < 0) {
      return;
    }
    setTipPercentage(newTipPercentage);
    // setTip((newTipPercentage / 100) * totalCostBeforeExtras);
  }

  function adjustFlatTip(amt: number) {
    toast(amt);
    if (amt === undefined) {
      return;
    }
    setTip(amt);
    if (totalCostBeforeExtras > 0) {
      setTipPercentage((amt / totalCostBeforeExtras) * 100);
    }
  }

  // const totalCostBeforeExtras = useMemo(
  //   () => items.reduce((sum, item) => sum + item.cost, 0),
  //   [items],
  // );
  totalCostBeforeExtras = items.reduce((sum, item) => sum + item.cost, 0);
  const [tax, setTax] = useState<number>(
    Math.round(0.0825 * totalCostBeforeExtras * 100) / 100,
  );
  useEffect(() => {
    if (totalCostBeforeExtras <= 0) {
      setTip(0);
      return;
    }
    const newTip = (totalCostBeforeExtras * tipPercentage) / 100;
    if (tip !== newTip) {
      setTip(newTip);
    }
  }, [totalCostBeforeExtras, tipPercentage]);

  // useEffect(() => {
  //   if (totalCostBeforeExtras <= 0) {
  //     return;
  //   }
  //   const newTipPercentage = (tip / totalCostBeforeExtras) * 100;
  //   if (tipPercentage !== newTipPercentage) {
  //     setTipPercentage(newTipPercentage);
  //   }
  // }, [totalCostBeforeExtras, tip]);
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
            <div className="flex justify-between items-center">
              <div className="flex gap-x-4 items-center">
                <p className="text-lg">Splitt</p>
                <ModeToggle />
              </div>
              <Button
                className="bg-red-600 cursor-pointer"
                onClick={clearReceipt}
              >
                Clear
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-y-2">
            <Button
              className="w-fit bg-blue-500 cursor-pointer"
              onClick={addPerson}
            >
              Add a person
            </Button>
            {people.map((person, idx, index) => (
              <div className="flex justify-between items-center">
                <div className="flex w-min items-center gap-x-1">
                  <Button
                    className="cursor-pointer w-6 h-6"
                    variant="ghost"
                    onClick={() => removePerson(person.id)}
                  >
                    <X />
                  </Button>
                  <BlurFade duration={0.25}>
                    <Input
                      type="text"
                      placeholder="Name"
                      value={person.name}
                      key={`${person.id}-${idx}`}
                      onChange={(e) =>
                        handleUpdatePersonName(person.id, e.target.value)
                      }
                      className="p-0 w-44 border-none outline-none shadow-none focus-visible:ring-0 underline"
                      onFocus={(e) =>
                        e.currentTarget.setSelectionRange(
                          e.currentTarget.value.length,
                          e.currentTarget.value.length,
                        )
                      }
                    />
                  </BlurFade>
                </div>
                <BlurFade duration={0.25}>
                  <div className="w-21 flex justify-between">
                    <div>$</div>
                    <div className="text-blue-500 font-bold">
                      {amountsOwed[person.id].toFixed(2)}{" "}
                    </div>
                  </div>
                </BlurFade>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-y-2">
            <Button
              className="w-fit bg-blue-500 cursor-pointer"
              onClick={addItem}
            >
              Add an item
            </Button>
            {items.map((item, idx) => (
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
                    <BlurFade
                      duration={0.25}
                      delay={hasMounted ? 0 : idx * 0.075}
                    >
                      <Input
                        type="text"
                        placeholder="Item"
                        value={item.name}
                        key={`${item.id}-${idx}`}
                        onChange={(e) =>
                          handleUpdateItemName(item.id, e.target.value)
                        }
                        className="p-0 w-44 border-none outline-none shadow-none focus-visible:ring-0 underline"
                        onFocus={(e) =>
                          e.currentTarget.setSelectionRange(
                            e.currentTarget.value.length,
                            e.currentTarget.value.length,
                          )
                        }
                      />
                    </BlurFade>
                  </div>
                  <BlurFade
                    duration={0.25}
                    delay={hasMounted ? 0 : idx * 0.075}
                  >
                    <div className="flex items-center justify-items-end">
                      <CurrencyInput
                        itemId={item.id}
                        value={item.cost}
                        onChange={handleUpdateItemCost}
                        className="w-24"
                      />
                    </div>
                  </BlurFade>
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
              <div className="flex gap-x-2 items-center">
                <div>Add Tax</div>
                <Button
                  className="cursor-pointer"
                  onClick={() => {
                    setTax(
                      Math.round(0.0825 * totalCostBeforeExtras * 100) / 100,
                    );
                  }}
                  variant="outline"
                >
                  <RotateCcw />
                </Button>
                <Button
                  className="cursor-pointer"
                  onClick={() => {
                    setTax(0);
                  }}
                  variant="outline"
                >
                  <X />
                </Button>
              </div>
              <CurrencyInput className="w-24" value={tax} onChange={setTax} />
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-y-2">
            {/* <Button className="w-fit bg-blue-500">Add tip</Button> */}
            <div className="flex justify-between items-center">
              <div className="flex gap-x-2 items-center">
                <div className="mr-2">Add Tip</div>
                <Button
                  className="cursor-pointer"
                  onClick={() => {
                    setTipPercentage(15);
                  }}
                  variant="outline"
                >
                  <RotateCcw />
                </Button>
                <Button
                  className="cursor-pointer"
                  onClick={() => {
                    setTipPercentage(0);
                  }}
                  variant="outline"
                >
                  <X />
                </Button>
              </div>
              <CurrencyInput
                className="w-24"
                value={tip}
                onChange={adjustFlatTip}
              />
            </div>
            <div className="flex items-center gap-x-4">
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => handleAdjustTipPercentage(-1)}
              >
                <Minus />
              </Button>
              {tipPercentage.toFixed(0)}%
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => handleAdjustTipPercentage(1)}
              >
                <Plus />
              </Button>
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
          <div className="flex flex-col gap-y-2">
            <p className="font-bold">Upload receipt</p>
            <div className="flex gap-x-4">
              <Input
                className="cursor-pointer"
                type="file"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              <Button
                className="cursor-pointer"
                onClick={() => handleReceiptUpload()}
              >
                <Upload />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
