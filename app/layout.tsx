import type {Metadata} from "next";
import "./globals.css";
import "./mobile-refinements.css";

export const metadata:Metadata={
  title:"ResolverSentinel · ENS identity drift quarantine",
  description:"Source-bound ENS resolver change review and trusted-contact quarantine on GenLayer",
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}

