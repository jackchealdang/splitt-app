import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Separator } from "./ui/separator";
import CurrencyInput from "@/components/ui/currency-input";
import {
  X,
  Upload,
  RotateCcw,
  Plus,
  Minus,
  Copy,
  Sparkles,
  Check,
  Frown,
  Users,
  UsersRound,
  UserRoundX,
  Utensils,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { BlurFade } from "./magicui/blur-fade";
import { ModeToggle } from "./ModeToggle";
import { motion } from "motion/react";
import { NumberTicker } from "./magicui/number-ticker";
import { Badge } from "./ui/badge";

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

const MotionButton = motion(Button);

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

const saveToLocalStorage = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getFromLocalStorage = (key: string) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

export function Calculator() {
  const [people, setPeople] = useState<Array<Person>>([]);
  const [items, setItems] = useState<Array<Item>>([]);
  const [tip, setTip] = useState<number>(0);
  const [tipPercentage, setTipPercentage] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [hasMounted, setHasMounted] = useState(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [totalCostBeforeExtras, setTotalCostBeforeExtras] = useState(0);
  const [showPeople, setShowPeople] = useState<boolean>(true);
  const [showItems, setShowItems] = useState<boolean>(true);
  const fileInputRef = useRef(null);
  const itemInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const peopleInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // const [personTips, setPersonTips] = useState<Array<PersonTip>>([]);
  // const [personTaxes, setPersonTaxes] = useState<Array<PersonTax>>([]);

  useEffect(() => {
    setHasMounted(false);
    const storedPeople = getFromLocalStorage("people");
    if (storedPeople) {
      setPeople(storedPeople);
      currentPersonId = getFromLocalStorage("currentPersonId");
    }

    const storedTipPercentage = getFromLocalStorage("tipPercentage");
    if (storedTipPercentage) {
      setTipPercentage(storedTipPercentage);
    }

    const storedItems = getFromLocalStorage("items");
    if (storedItems) {
      setItems(storedItems);
      calculateTotalCostBeforeExtras(storedItems);
      currentItemId = getFromLocalStorage("currentItemId");
    }

    const storedTip = getFromLocalStorage("tip");
    if (storedTip) {
      setTip(storedTip);
    }

    const storedTax = getFromLocalStorage("tax");
    if (storedTax) setTax(storedTax);
  }, []);

  useEffect(() => {
    if (people) {
      saveToLocalStorage("people", people);
      saveToLocalStorage("currentPersonId", currentPersonId);
    }
  }, [people]);

  useEffect(() => {
    if (items) {
      saveToLocalStorage("items", items);
      saveToLocalStorage("currentItemId", currentItemId);
    }
  }, [items]);

  useEffect(() => {
    saveToLocalStorage("tipPercentage", tipPercentage);
    saveToLocalStorage("tip", tip);
  }, [tipPercentage, tip]);

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
      toast.error("Please select a receipt to upload.");
      return;
    }
    toast.promise(
      (async () => {
        const fileKey = await uploadToS3();
        const extractedData = await processReceipt(fileKey);
        let newItems: Array<Item> = [];
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
        calculateTotalCostBeforeExtrasTipPercentage(
          newItems,
          extractedData.tip,
        );
        setTax(extractedData.tax);
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
        setFile(null);
      })(),
      {
        loading: "Processing receipt...",
        success: "Receipt processed successfully!",
        error: "Failed to process receipt. Please try again.",
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
    calculateTotalCostBeforeExtras(updatedItems);
  }

  function handleUpdatePersonOnItem(itemId: number, personId: number) {
    const newItems = items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            people: item.people.includes(personId)
              ? item.people.filter((id) => id !== personId)
              : [...item.people, personId],
          }
        : item,
    );
    setItems(newItems);
    calculateTotalCostBeforeExtras(newItems);
  }

  function addPerson() {
    setHasMounted(true);
    const newId = getNextPersonId();
    // const randomNumber = Math.floor(Math.random() * randomNames.length);
    const newName = "New person";
    const newPerson: Person = {
      id: newId,
      name: newName,
    };
    setPeople((prevPeople) => [...prevPeople, newPerson]);

    // Wait for DOM update before focusing on new input
    setTimeout(() => {
      const input = peopleInputRefs.current[newId];
      if (input) {
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        input.focus();
      }
    }, 0);
  }

  function removePerson(id: number) {
    setPeople(people.filter((person) => person.id !== id));
  }

  function removeItem(id: number) {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    calculateTotalCostBeforeExtras(newItems);
  }

  function addItem() {
    setHasMounted(true);
    const newId = getNextItemId();
    const newItem: Item = {
      id: newId,
      name: "New item",
      cost: 0,
      people: [],
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    calculateTotalCostBeforeExtras(newItems);

    // Wait for DOM update before focusing on new input
    setTimeout(() => {
      const input = itemInputRefs.current[newId];
      if (input) {
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        input.focus();
      }
    }, 0);
  }

  function handleUpdateItemCost(
    itemId: string | number | undefined,
    newCost: number,
  ) {
    if (itemId) {
      const newItems = items.map((item) =>
        item.id === itemId ? { ...item, cost: newCost } : item,
      );
      setItems(newItems);
      calculateTotalCostBeforeExtras(newItems);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  }

  function clearReceipt() {
    setItems([]);
    setTotalCostBeforeExtras(0);
    setHasMounted(false);
    setPeople([]);
    setTax(0);
    setTip(0);
    setTipPercentage(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    setFile(null);
    toast("Receipt cleared!", {
      icon: <Sparkles className="size-5" />,
      duration: 2000,
    });
  }

  const handleAdjustTipPercentage = (amt: number) => {
    const newTipPercentage = Math.trunc(tipPercentage) + amt;
    if (newTipPercentage < 0) {
      return;
    }
    setTipPercentage(newTipPercentage);
    const newTip = (newTipPercentage / 100) * totalCostBeforeExtras;
    setTip(newTip);
  };

  function adjustFlatTip(amt: number) {
    if (amt === undefined) {
      return;
    }
    setTip(amt);
    if (totalCostBeforeExtras > 0) {
      setTipPercentage((amt / totalCostBeforeExtras) * 100);
    }
  }

  function calculateTotalCostBeforeExtras(items: Array<Item>) {
    const newTotalCost = items.reduce((sum, item) => sum + item.cost, 0);
    setTotalCostBeforeExtras(newTotalCost);
    if (newTotalCost <= 0) {
      setTip(0);
    } else {
      const newTip = (newTotalCost * tipPercentage) / 100;
      setTip(newTip);
    }
  }

  function calculateTotalCostBeforeExtrasTipPercentage(
    items: Array<Item>,
    newTip: number,
  ) {
    const newTotalCost = items.reduce((sum, item) => sum + item.cost, 0);
    setTotalCostBeforeExtras(newTotalCost);
    if (newTotalCost > 0) {
      const newTipPercentage = (newTip / newTotalCost) * 100;
      setTip(newTip);
      setTipPercentage(newTipPercentage);
    }
  }

  const [tax, setTax] = useState<number>(
    Math.round(0.0825 * totalCostBeforeExtras * 100) / 100,
  );
  useEffect(() => {
    saveToLocalStorage("tax", tax);
  }, [tax]);
  // useEffect(() => {
  //   if (totalCostBeforeExtras <= 0) {
  //     setTip(0);
  //     return;
  //   }
  //   const newTip = (totalCostBeforeExtras * tipPercentage) / 100;
  //   if (tip !== newTip) {
  //     adjustFlatTip(newTip);
  //   }
  // }, [totalCostBeforeExtras]);

  const totalCostAfterExtras = totalCostBeforeExtras + tip + tax;
  let peopleSubTotals: Array<PersonSubTotal> = [];
  let peopleTips: Array<PersonTip> = [];
  let peopleTaxes: Array<PersonTax> = [];

  function calculateAmountsOwed(items: Array<Item>, people: Array<Person>) {
    let amounts: Record<number, number> = {};

    people.forEach((person) => (amounts[person.id] = 0));
    if (totalCostBeforeExtras === 0) {
      Object.keys(amounts).forEach((personId) => {
        const newPersonSubTotal: PersonSubTotal = {
          id: Number(personId),
          amt: 0,
        };
        const newPersonTip: PersonTip = {
          id: Number(personId),
          amt: 0,
        };
        const newPersonTax: PersonTax = {
          id: Number(personId),
          amt: 0,
        };
        peopleSubTotals.push(newPersonSubTotal);
        peopleTips.push(newPersonTip);
        peopleTaxes.push(newPersonTax);
      });

      return amounts;
    }

    items.forEach((item) => {
      if (item.people.length > 0) {
        const share = item.cost / item.people.length;
        item.people.forEach((personId) => {
          amounts[personId] += share;
        });
      }
    });

    Object.keys(amounts).forEach((personId) => {
      const personTotal = amounts[Number(personId)];
      const personTip = (personTotal / totalCostBeforeExtras) * tip;
      const personTax = (personTotal / totalCostBeforeExtras) * tax;
      const newPersonSubTotal: PersonSubTotal = {
        id: Number(personId),
        amt: personTotal,
      };
      const newPersonTip: PersonTip = {
        id: Number(personId),
        amt: personTip,
      };
      const newPersonTax: PersonTax = {
        id: Number(personId),
        amt: personTax,
      };
      peopleSubTotals.push(newPersonSubTotal);
      peopleTips.push(newPersonTip);
      peopleTaxes.push(newPersonTax);
      amounts[Number(personId)] += personTip + personTax;
    });

    // setPersonTips(peopleTips);
    // setPersonTaxes(peopleTaxes);

    return amounts;
  }

  const copyToClipboard = () => {
    let text = "";
    people.forEach((person) => {
      text += `${person.name ? person.name : "Unnamed"} owes $${amountsOwed[person.id].toFixed(2)}\n`;
    });
    text = text.slice(0, -1);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    const toastMsg = people.length
      ? "Copied to clipboard!"
      : "This is a lonely dinner... (there's no one here)";
    toast(toastMsg, {
      icon: people.length ? (
        <Copy className="size-5" />
      ) : (
        <Frown className="size-5" />
      ),
      duration: 2000,
    });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    addFunction: Function,
  ) => {
    if (event.key === "Enter") {
      addFunction();
    }
  };

  const amountsOwed = calculateAmountsOwed(items, people);

  return (
    <div>
      <Card className="w-[25rem] h-min-[32rem] mt-6 mb-14">
        <CardHeader>
          <CardTitle>
            <div className="flex justify-between items-center">
              <div className="flex gap-x-2 items-center">
                <p className="text-lg mr-2">Splitt</p>
                <ModeToggle />
                <Button
                  className="cursor-pointer aspect-square"
                  variant="outline"
                  onClick={() => {
                    copyToClipboard();
                  }}
                >
                  <Copy
                    className={`${copied ? "scale-0" : "scale-100"} transition-all duration-300`}
                  />
                  <Check
                    className={`absolute ${copied ? "scale-100" : "scale-0"} transition-all duration-300`}
                  />
                </Button>
              </div>
              <MotionButton
                className="bg-red-600 cursor-pointer"
                onClick={clearReceipt}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                Clear
              </MotionButton>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center gap-x-2">
              <p className="font-bold mr-2">People</p>
              <Button
                variant="outline"
                onClick={() => setShowItems(!showItems)}
              >
                <Utensils
                  className={`transition-all duration-300 ${showItems ? "scale-100" : "scale-0"}`}
                />
                <UtensilsCrossed
                  className={`absolute transition-all duration-300 ${showItems ? "scale-0" : "scale-100"}`}
                />
              </Button>
            </div>
            {people.map((person, idx, index) => (
              <div>
                <div className="flex justify-between items-center">
                  <div className="flex w-min items-center gap-x-1">
                    <Button
                      className="cursor-pointer w-6 h-6"
                      variant="ghost"
                      onClick={() => removePerson(person.id)}
                    >
                      <X />
                    </Button>
                    <BlurFade
                      duration={0.3}
                      delay={hasMounted ? 0 : idx * 0.0825}
                    >
                      <Input
                        type="text"
                        placeholder="Name"
                        value={person.name}
                        key={`${person.id}-${idx}`}
                        ref={(el) => {
                          peopleInputRefs.current[person.id] = el;
                        }}
                        onChange={(e) =>
                          handleUpdatePersonName(person.id, e.target.value)
                        }
                        className="p-0 w-44 border-none outline-none shadow-none focus-visible:ring-0 underline"
                        onFocus={(e) => {
                          e.currentTarget.setSelectionRange(
                            0,
                            e.currentTarget.value.length,
                          );
                        }}
                        onKeyDownCapture={(e) => handleKeyDown(e, addPerson)}
                      />
                    </BlurFade>
                  </div>
                  <BlurFade
                    duration={0.3}
                    delay={hasMounted ? 0 : idx * 0.0825}
                  >
                    <div className="w-21 flex justify-between">
                      <div>$</div>
                      {/* <div className="text-blue-500 font-bold"> */}
                      {/*   {amountsOwed[person.id].toFixed(2)}{" "} */}
                      {/* </div> */}
                      <NumberTicker
                        value={amountsOwed[person.id]}
                        decimalPlaces={2}
                        className="tracking-tighter font-bold text-blue-500 dark:text-blue-500"
                        startValue={0}
                      />
                    </div>
                  </BlurFade>
                </div>
                <div className="flex flex-wrap gap-1">
                  {showItems &&
                    items.map(
                      (item) =>
                        item.people.includes(person.id) && (
                          <>
                            <Badge
                              variant="secondary"
                              className="bg-gray-200 dark:bg-gray-800"
                            >
                              {item.name} $
                              {(item.cost / item.people.length).toFixed(2)}
                            </Badge>
                          </>
                        ),
                    )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {showItems && (
                    <>
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 dark:bg-gray-900 text-blue-500 font-bold"
                      >
                        Subtotal $
                        {peopleSubTotals
                          .find((p) => p.id === person.id)
                          ?.amt.toFixed(2)}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 dark:bg-gray-900 text-blue-500 font-bold"
                      >
                        Tip $
                        {peopleTips
                          .find((p) => p.id === person.id)
                          ?.amt.toFixed(2)}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 dark:bg-gray-900 text-blue-500 font-bold"
                      >
                        Tax $
                        {peopleTaxes
                          .find((p) => p.id === person.id)
                          ?.amt.toFixed(2)}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            ))}
            <MotionButton
              className={`bg-blue-500 cursor-pointer w-fit ${people.length > 0 && items.length > 0 && showItems ? "mt-2" : ""}`}
              onClick={addPerson}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Add a person
            </MotionButton>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center gap-x-2">
              <p className="font-bold mr-2">Items</p>
              <Button
                variant="outline"
                onClick={() => setShowPeople(!showPeople)}
              >
                <UsersRound
                  className={`transition-all duration-300 ${showPeople ? "scale-100" : "scale-0"}`}
                />
                <UserRoundX
                  className={`absolute transition-all duration-300 ${showPeople ? "scale-0" : "scale-100"}`}
                />
              </Button>
            </div>
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
                      duration={0.3}
                      delay={hasMounted ? 0 : idx * 0.0825}
                    >
                      <Input
                        type="text"
                        placeholder="Item"
                        value={item.name}
                        key={`${item.id}-${idx}`}
                        ref={(el) => {
                          itemInputRefs.current[item.id] = el;
                        }}
                        onChange={(e) =>
                          handleUpdateItemName(item.id, e.target.value)
                        }
                        className="p-0 w-44 border-none outline-none shadow-none focus-visible:ring-0 underline"
                        onFocus={(e) => {
                          e.currentTarget.setSelectionRange(
                            0,
                            e.currentTarget.value.length,
                          );
                        }}
                        onKeyDownCapture={(e) => handleKeyDown(e, addItem)}
                      />
                    </BlurFade>
                  </div>
                  <BlurFade
                    duration={0.3}
                    delay={hasMounted ? 0 : idx * 0.0825}
                  >
                    <div className="flex items-center justify-items-end">
                      <CurrencyInput
                        itemId={item.id}
                        value={item.cost}
                        onChange={handleUpdateItemCost}
                        className="w-24"
                        onKeyDownCapture={(e) => handleKeyDown(e, addItem)}
                      />
                    </div>
                  </BlurFade>
                  {/* <div>${item.cost.toFixed(2)}</div> */}
                </div>
                <BlurFade
                  duration={0.3}
                  delay={hasMounted ? 0 : 0.01 + idx * 0.0825}
                >
                  <div className="flex flex-wrap gap-2">
                    {showPeople &&
                      people.map((person) => (
                        <Button
                          className={`w-fit px-2 cursor-pointer text-xs ${person.name === "" ? "text-gray-400" : ""}`}
                          variant={
                            item.people.includes(person.id)
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            handleUpdatePersonOnItem(item.id, person.id)
                          }
                        >
                          {person.name ? person.name : "Name"}
                        </Button>
                      ))}
                  </div>
                </BlurFade>
              </div>
            ))}
            <MotionButton
              className={`bg-blue-500 cursor-pointer w-fit ${items.length > 0 && people.length > 0 && showPeople ? "mt-2" : ""}`}
              onClick={addItem}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Add an item
            </MotionButton>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-y-2">
            <div className="flex justify-between items-center">
              <div className="flex gap-x-2 items-center">
                <div className="mr-2 font-bold">Add Tax</div>
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
                <div className="mr-2 font-bold">Add Tip</div>
                {/* <Button */}
                {/*   className="cursor-pointer px-2" */}
                {/*   onClick={() => { */}
                {/*     totalCostBeforeExtras <= 0 */}
                {/*       ? setTipPercentage(15) */}
                {/*       : adjustFlatTip((15 / 100) * totalCostBeforeExtras); */}
                {/*   }} */}
                {/*   variant="outline" */}
                {/* > */}
                {/*   15% */}
                {/* </Button> */}
                <Button
                  className="cursor-pointer px-2"
                  onClick={() => {
                    totalCostBeforeExtras <= 0
                      ? setTipPercentage(20)
                      : adjustFlatTip((20 / 100) * totalCostBeforeExtras);
                  }}
                  variant="outline"
                >
                  20%
                </Button>
                <Button
                  className="cursor-pointer"
                  onClick={() => {
                    setTipPercentage(0);
                    setTip(0);
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
