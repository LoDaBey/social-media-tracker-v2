export type ManagerOption = {
  id: number;
  full_name: string;
  countries: string[];
};

export type ManagerHolderRow = {
  id: number;
  full_name: string;
  email: string;
  country: string;
  language: string | null;
  setupComplete: boolean;
  targetAccountsSum: number;
};

export type ManagerCountryGroup = {
  country: string;
  holders: ManagerHolderRow[];
};

export type ManagerHomeTableProps = {
  groups: ManagerCountryGroup[];
};

export type ManagerTeamRowProps = {
  row: ManagerHolderRow;
};
