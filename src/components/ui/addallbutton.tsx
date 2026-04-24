import { Button } from './button';
import type { Item } from '@/lib/interfaces';

interface AddAllButtonProps {
  checkIfAllPeopleOnItem: (item: Item) => boolean;
  handleRemoveAllPeopleFromItem: (itemId: number) => void;
  handleAddAllPeopleToItem: (itemId: number) => void;
  item: Item;
}

export const AddAllButton: React.FC<AddAllButtonProps> = ({
  checkIfAllPeopleOnItem,
  handleRemoveAllPeopleFromItem,
  handleAddAllPeopleToItem,
  item,
}: AddAllButtonProps) => {
  const allPeopleOnItem = checkIfAllPeopleOnItem(item);

  return (
    <Button
      className={`w-fit px-2 cursor-pointer text-xs ${!allPeopleOnItem ? 'text-gray-500' : ''}`}
      variant={allPeopleOnItem ? 'default' : 'outline'}
      onClick={() =>
        allPeopleOnItem
          ? handleRemoveAllPeopleFromItem(item.id)
          : handleAddAllPeopleToItem(item.id)
      }
    >
      All
    </Button>
  );
};
