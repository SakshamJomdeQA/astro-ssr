/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    requestId: string;
    startTime: number;
    visitorIp: string;
    theme: string;
    isAuthenticated: boolean;
  }
}
