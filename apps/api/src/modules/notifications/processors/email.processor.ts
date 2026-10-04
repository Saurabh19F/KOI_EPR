import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationsService } from '../notifications.service';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { to, subject, html, text } = job.data;
    await this.notificationsService.sendEmail({ to, subject, html, text });
    return { sent: true };
  }
}
