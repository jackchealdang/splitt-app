import { GithubIcon, Globe, Linkedin } from 'lucide-react';
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
          <DialogTitle className='text-center'>About Splitt</DialogTitle>
        </DialogHeader>
        <div className='mt-3 flex flex-col items-center justify-center'>
          <p>Thanks for using Splitt!</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
