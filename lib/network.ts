export const explorer="https://explorer-studio.genlayer.com";
export const configuredContract=process.env.NEXT_PUBLIC_CONTRACT_ADDRESS||"0xf0090b257FF2178B84faE25f137a49Edf6a70938";
export const txLink=(hash:string)=>`${explorer}/tx/${hash}`;
export const addressLink=(address:string)=>`${explorer}/address/${address}`;

