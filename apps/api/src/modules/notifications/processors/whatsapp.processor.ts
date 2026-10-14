import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationsService } from '../notifications.service';

@Processor('whatsapp')
export class WhatsAppProcessor extends WorkerHost {
  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { to, message } = job.data;
    await this.notificationsService.sendWhatsApp({ to, message });
    return { sent: true };
  }
}
