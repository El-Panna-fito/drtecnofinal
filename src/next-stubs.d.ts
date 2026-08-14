declare module "next/headers" {
  export function cookies(): Promise<{
    getAll(): { name: string; value: string }[];
    set(name: string, value: string, options?: any): void;
  }>;
}

declare module "next/server" {
  export class NextRequest {
    cookies: {
      getAll(): { name: string; value: string }[];
      set(name: string, value: string, options?: any): void;
    };
    headers: any;
  }
  export class NextResponse {
    static next(options?: any): NextResponse;
    cookies: {
      set(name: string, value: string, options?: any): void;
    };
  }
}
