'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';

export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, forwardedRef) => (
  <CommandPrimitive
    ref={forwardedRef}
    className={className}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

export const CommandDialog = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive>) => (
  <Command {...props}>{children}</Command>
);

export const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, forwardedRef) => (
  <CommandPrimitive.Input
    ref={forwardedRef}
    className={`command-input ${className || ''}`}
    {...props}
  />
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

export const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, forwardedRef) => (
  <CommandPrimitive.List
    ref={forwardedRef}
    className={className}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

export const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, forwardedRef) => (
  <CommandPrimitive.Empty ref={forwardedRef} {...props} />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

export const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, forwardedRef) => (
  <CommandPrimitive.Group
    ref={forwardedRef}
    className={`command-group ${className || ''}`}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

export const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, forwardedRef) => (
  <CommandPrimitive.Item
    ref={forwardedRef}
    className={`command-item ${className || ''}`}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

export const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, forwardedRef) => (
  <CommandPrimitive.Separator
    ref={forwardedRef}
    className={`command-separator ${className || ''}`}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;