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

export function About({
  showAbout,
  setShowAbout,
}: {
  showAbout?: boolean;
  setShowAbout: (value: boolean) => void;
}) {
  return (
    <Dialog
      open={showAbout}
      onOpenChange={() => setShowAbout(false)}
    >
      <DialogContent className='w-80 max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center'>About Splitt</DialogTitle>
        </DialogHeader>
        <div className='mt-3 flex flex-col items-center justify-center'>
          <p>Thanks for using Splitt!</p>
          <p className='mt-2'>Created by Jackcheal Dang.</p>
          <div className='mt-2 flex gap-x-2'>
            <a href='https://github.com/jackchealdang'>
              <Badge>
                <GithubIcon data-icon='inline-start' />
                Github
              </Badge>
            </a>
            <a href='https://jackchealdang.com'>
              <Badge>
                <Globe data-icon='inline-start' />
                My website!
              </Badge>
            </a>
            <a href='https://linkedin.com/in/jackchealdang'>
              <Badge>
                <Linkedin data-icon='inline-start' />
                LinkedIn
              </Badge>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
