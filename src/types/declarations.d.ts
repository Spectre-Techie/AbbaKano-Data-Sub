declare module 'react-native-worklets' {
  export function scheduleOnRN<T extends (...args: any[]) => any>(fn: T, ...args: Parameters<T>): void;
  export function scheduleOnUI<T extends (...args: any[]) => any>(fn: T, ...args: Parameters<T>): void;
}

declare module 'expo-linear-gradient' {
  import { Component } from 'react';
  import type { ColorValue, ViewProps } from 'react-native';

  export type LinearGradientPoint = { x: number; y: number } | [number, number];

  export interface LinearGradientProps extends ViewProps {
    colors: readonly [ColorValue, ColorValue, ...ColorValue[]] | string[];
    locations?: readonly [number, number, ...number[]] | number[] | null;
    start?: LinearGradientPoint | null;
    end?: LinearGradientPoint | null;
    dither?: boolean;
  }

  export class LinearGradient extends Component<LinearGradientProps> {}
}

declare module 'expo-linking' {
  export function getInitialURL(): Promise<string | null>;
  export function addEventListener(
    type: 'url',
    listener: (event: { url: string }) => void
  ): { remove: () => void };
  export function createURL(path?: string, namedOpts?: any): string;
  export function parse(url: string): any;
  export function openURL(url: string): Promise<boolean>;
  export function canOpenURL(url: string): Promise<boolean>;
}

declare module 'expo-clipboard' {
  export function setStringAsync(text: string): Promise<boolean>;
  export function getStringAsync(): Promise<string>;
  export function hasStringAsync(): Promise<boolean>;
}


