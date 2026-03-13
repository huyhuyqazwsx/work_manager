export type TicketPayloadItem = {
  employeeCode: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

export type TicketPayload = {
  tickets: TicketPayloadItem[];
};
