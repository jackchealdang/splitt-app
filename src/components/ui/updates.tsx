import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Label } from './label';

export function Updates({
  showUpdates,
  setShowUpdates,
}: {
  showUpdates?: boolean;
  setShowUpdates: (value: boolean) => void;
}) {
  return (
    <Dialog
      open={showUpdates}
      onOpenChange={() => setShowUpdates(false)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New & improved updates! 🤠</DialogTitle>
          <DialogDescription>
            New updates to make Splitt even better!
          </DialogDescription>
        </DialogHeader>
        <div className='mt-3'>
          <p className='font-bold font-lg'>V. 1.0.1</p>
          <ul className='list-disc list-inside mt-3 italic'>
            <li>Added Settings dropdown menu</li>
            <li>Added option to split tips evenly</li>
            <li>Added option to split tax evenly</li>
            <li>Added duplicate item button</li>
            <li>Added update dialog!</li>
            <li>UI enhancements for visual clarity and ease of use</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
