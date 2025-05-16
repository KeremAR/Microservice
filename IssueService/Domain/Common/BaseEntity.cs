using System.Collections.Generic;
using MediatR;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IssueService.Domain.Common;

public abstract class BaseEntity
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public ObjectId Id { get; protected set; }

    private readonly List<INotification> _events = new();
    public virtual IReadOnlyCollection<INotification> Events => _events.AsReadOnly();

    protected void AddEvent(INotification @event)
    {
        _events.Add(@event);
    }

    public virtual void ClearEvents()
    {
        _events.Clear();
    }
}
