declare module 'gsmarena-api' {
  const gsmarena: {
    search: { search(query: string): Promise<unknown> };
    catalog: { getDevice(id: string): Promise<unknown> };
  };
  export default gsmarena;
}
