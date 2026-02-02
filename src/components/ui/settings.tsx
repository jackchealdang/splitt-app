import { Switch } from '@/components/ui/switch';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import React, { useState } from 'react';
import { About } from './about';

export function Settings({
  tipEvenly,
  setTipEvenly,
  taxEvenly,
  setTaxEvenly,
  setShowUpdates,
}: {
  tipEvenly: boolean;
  setTipEvenly: (value: boolean) => void;
  taxEvenly: boolean;
  setTaxEvenly: (value: boolean) => void;
  setShowUpdates: (value: boolean) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);

  return (
    <div>
      <About
        showAbout={showAbout}
        setShowAbout={setShowAbout}
      />
      <DropdownMenu
        open={dropdownOpen}
        onOpenChange={(val) => setDropdownOpen(val)}
      >
        <DropdownMenuTrigger
          asChild
          onClick={() => {
            setDropdownOpen((val) => !val);
          }}
        >
          <Button
            className='cursor-pointer'
            variant='outline'
          >
            Settings
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='z-50'
          sideOffset={6}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className='flex justify-between w-full'>
                Split Tip Evenly
                <Switch
                  className='cursor-pointer'
                  onClick={() => setTipEvenly(!tipEvenly)}
                  checked={tipEvenly}
                />
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className='flex justify-between w-full'>
                Split Tax Evenly
                <Switch
                  className='cursor-pointer'
                  onClick={() => setTaxEvenly(!taxEvenly)}
                  checked={taxEvenly}
                />
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              More Settings (Coming Soon!)
            </DropdownMenuItem>
            <DropdownMenuItem
              className='cursor-pointer'
              onClick={() => setShowUpdates(true)}
            >
              What's New?
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowAbout(true)}>
              About
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
