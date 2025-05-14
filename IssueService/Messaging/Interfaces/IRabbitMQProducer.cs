namespace IssueService.Messaging.Interfaces;

public interface IRabbitMQProducer
{
    void PublishIssueCreated(object message);
    void PublishIssueStatusChanged(object message);
} 