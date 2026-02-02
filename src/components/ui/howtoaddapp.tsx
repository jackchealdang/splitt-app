import { GithubIcon, Globe, Heading1, Linkedin, Share } from 'lucide-react';
import { Badge } from './badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Label } from './label';

export function HowToAddApp({
  show,
  setShow,
}: {
  show?: boolean;
  setShow: (value: boolean) => void;
}) {
  return (
    <Dialog
      open={show}
      onOpenChange={() => setShow(false)}
    >
      <DialogContent className='w-80 max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center'>
            Add Splitt as an App
          </DialogTitle>
        </DialogHeader>
        <div className='mt-3 flex flex-col items-start justify-center'>
          <p className='font-bold'>Safari & Chrome</p>
          <ol className='list-decimal list-inside mt-2'>
            <li>
              Tap the <Share className='inline align-middle size-6' /> icon.
            </li>
            <li>Scroll down and tap "Add to Home Screen".</li>
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
