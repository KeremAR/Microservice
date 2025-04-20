using MediatR;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IssueService.Domain.Common;

public abstract class BaseEntity
{
    [BsonId]
    public ObjectId Id { get; protected set; } = ObjectId.GenerateNewId();

    private readonly List<INotification> _events = new();
    [BsonIgnore]
    public IReadOnlyCollection<INotification> Events => _events;

    protected void AddEvent(INotification @event) => _events.Add(@event);
    public void ClearEvents() => _events.Clear();
}
