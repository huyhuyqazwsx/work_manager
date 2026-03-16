export class FileUploadQueue {
  constructor(
    public readonly id: string,
    public readonly leaveRequestId: string,
    public localPath: string,
    public retryCount: number,
    public readonly createdAt: Date,
  ) {}
}
