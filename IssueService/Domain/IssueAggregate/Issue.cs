using IssueService.Domain.Common;
using IssueService.Domain.IssueAggregate.Events;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;
using MediatR;

namespace IssueService.Domain.IssueAggregate;

public class Issue : BaseEntity
{
    public string Title { get; private set; }
    public string Description { get; private set; }
    public string Category { get; private set; }
    public string PhotoUrl { get; private set; }
    public string UserId { get; private set; }
    public int DepartmentId { get; private set; }
    public double Latitude { get; private set; }
    public double Longitude { get; private set; }
    public IssueStatus Status { get; private set; } = IssueStatus.Pending;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    [BsonIgnore] // Bu alan MongoDB'ye kaydedilmeyecek
    [JsonPropertyName("hexId")] // JSON'da "hexId" olarak görünecek
    public string HexId => Id.ToString(); // ObjectId'yi string'e çevirir

    private Issue() { } // Mongo için boş ctor

    public Issue(string title, string description, string category, string photoUrl, string userId, int departmentId, double latitude, double longitude)
    {
        Title = title;
        Description = description;
        Category = category;
        PhotoUrl = photoUrl;
        UserId = userId;
        DepartmentId = departmentId;
        Latitude = latitude;
        Longitude = longitude;

        // Sadece yeni oluşturulduğunda event ekle
        AddEvent(new IssueCreatedEvent(this));
    }

    public void UpdateStatus(IssueStatus newStatus)
    {
        Console.WriteLine($"UpdateStatus called. Current status: {Status}, New status: {newStatus}");
        
        if (Status == newStatus)
        {
            Console.WriteLine("Status is the same, no update needed");
            return;
        }
        
        var oldStatus = Status;
        Status = newStatus;
        Console.WriteLine($"Status updated from {oldStatus} to {newStatus}");
        
        // Sadece durum değişikliği eventi ekle
        var statusChangedEvent = new IssueStatusChangedEvent(Id.ToString(), newStatus.ToString(), UserId, Title);
        Console.WriteLine($"Creating IssueStatusChangedEvent: IssueId={Id}, NewStatus={newStatus}, UserId={UserId}, Title={Title}");
        AddEvent(statusChangedEvent);
        Console.WriteLine("Event added successfully");
    }

    // BaseEntity'den gelen Events koleksiyonunu override et
    public override IReadOnlyCollection<INotification> Events => _events.AsReadOnly();
    private readonly List<INotification> _events = new();

    public void AddEvent(INotification @event)
    {
        _events.Add(@event);
    }

    public void ClearEvents()
    {
        _events.Clear();
    }

    // Mevcut Id özelliği (BaseEntity'den geliyor) ObjectId tipinde.
    // JSON yanıtında hem mevcut "id" nesnesini (ObjectId'nin detaylı yapısı) hem de "hexId" string'ini istiyoruz.
    // ObjectId'nin varsayılan serileşmesi (detaylı nesne) BaseEntity'deki Id özelliği üzerinden olacaktır.
    // Eklediğimiz HexId ise bunun string halini sunacak.
}
