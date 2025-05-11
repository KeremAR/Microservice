using Xunit;
using Moq;
using FluentAssertions;
using IssueService.Services.Implementations;
using IssueService.Repositories.Interfaces;
using IssueService.DTOs;
using IssueService.Domain.IssueAggregate;
using IssueService.Domain.IssueAggregate.Events;
using MediatR;
using System;
using System.Threading.Tasks;
using System.Threading;

namespace IssueService.Tests.Services
{
    public class IssueServiceTests
    {
        private readonly Mock<IIssueRepository> _mockRepository;
        private readonly Mock<IMediator> _mockMediator;
        private readonly IssueServiceImpl _service;

        public IssueServiceTests()
        {
            _mockRepository = new Mock<IIssueRepository>();
            _mockMediator = new Mock<IMediator>();
            _service = new IssueServiceImpl(_mockRepository.Object, _mockMediator.Object);
        }

        [Fact]
        public async Task ReportIssueAsync_ValidRequest_CreatesAndReturnsIssue()
        {
            // Arrange
            var request = new CreateIssueRequest
            {
                Title = "Test Issue",
                Description = "Test Description",
                Category = "Test Category",
                PhotoUrl = "http://test.com/photo.jpg",
                UserId = "user123",
                DepartmentId = "dept123"
            };

            Issue savedIssue = null;
            _mockRepository.Setup(x => x.CreateAsync(It.IsAny<Issue>()))
                .Callback<Issue>(issue => savedIssue = issue)
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.ReportIssueAsync(request);

            // Assert
            savedIssue.Should().NotBeNull();
            savedIssue.Title.Should().Be(request.Title);
            savedIssue.Description.Should().Be(request.Description);
            savedIssue.Category.Should().Be(request.Category);
            savedIssue.PhotoUrl.Should().Be(request.PhotoUrl);
            savedIssue.UserId.Should().Be(request.UserId);
            savedIssue.DepartmentId.Should().Be(request.DepartmentId);
            savedIssue.Status.Should().Be(IssueStatus.Pending);

            _mockMediator.Verify(x => x.Publish(It.IsAny<INotification>(), It.IsAny<CancellationToken>()), Times.Once);

            result.Should().NotBeNull();
            result.Title.Should().Be(request.Title);
            result.Description.Should().Be(request.Description);
            result.Category.Should().Be(request.Category);
            result.Status.Should().Be(IssueStatus.Pending.ToString());
        }

        [Fact]
        public async Task GetIssueByIdAsync_ExistingIssue_ReturnsIssue()
        {
            // Arrange
            var issueId = "issue123";
            var issue = new Issue(
                "Test Issue",
                "Test Description",
                "Test Category",
                "http://test.com/photo.jpg",
                "user123",
                "dept123"
            );

            _mockRepository.Setup(x => x.GetByIdAsync(issueId))
                .ReturnsAsync(issue);

            // Act
            var result = await _service.GetIssueByIdAsync(issueId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(issue.Id.ToString());
            result.Title.Should().Be(issue.Title);
            result.Description.Should().Be(issue.Description);
            result.Category.Should().Be(issue.Category);
            result.Status.Should().Be(issue.Status.ToString());
        }

        [Fact]
        public async Task GetIssueByIdAsync_NonExistingIssue_ThrowsException()
        {
            // Arrange
            var issueId = "nonexistent";
            _mockRepository.Setup(x => x.GetByIdAsync(issueId))
                .ReturnsAsync((Issue)null);

            // Act & Assert
            await _service.Invoking(s => s.GetIssueByIdAsync(issueId))
                .Should().ThrowAsync<KeyNotFoundException>();
        }

        [Fact]
        public async Task UpdateIssueStatusAsync_ValidStatus_UpdatesAndPublishesEvent()
        {
            // Arrange
            var issueId = "issue123";
            var newStatus = IssueStatus.Resolved;
            var issue = new Issue(
                "Test Issue",
                "Test Description",
                "Test Category",
                "http://test.com/photo.jpg",
                "user123",
                "dept123"
            );

            _mockRepository.Setup(x => x.GetByIdAsync(issueId))
                .ReturnsAsync(issue);

            _mockRepository.Setup(x => x.UpdateStatusAsync(issueId, newStatus))
                .Returns(Task.CompletedTask);

            // Act
            await _service.UpdateIssueStatusAsync(issueId, newStatus);

            // Assert
            issue.Status.Should().Be(newStatus);
            _mockRepository.Verify(x => x.UpdateStatusAsync(issueId, newStatus), Times.Once);
            _mockMediator.Verify(x => x.Publish(It.IsAny<INotification>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        }

        [Fact]
        public async Task UpdateIssueStatusAsync_NonExistingIssue_ThrowsException()
        {
            // Arrange
            var issueId = "nonexistent";
            var newStatus = IssueStatus.Resolved;

            _mockRepository.Setup(x => x.GetByIdAsync(issueId))
                .ReturnsAsync((Issue)null);

            // Act & Assert
            await _service.Invoking(s => s.UpdateIssueStatusAsync(issueId, newStatus))
                .Should().ThrowAsync<KeyNotFoundException>();
        }
    }
} 