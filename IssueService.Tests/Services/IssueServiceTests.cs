using Xunit;
using Moq;
using FluentAssertions;
using IssueService.Services.Implementations;
using IssueService.Repositories.Interfaces;
using IssueService.DTOs;
using IssueService.Domain.IssueAggregate;
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

            var issue = new Issue(
                request.Title,
                request.Description,
                request.Category,
                request.PhotoUrl,
                request.UserId,
                request.DepartmentId
            );

            _mockRepository
                .Setup(x => x.CreateAsync(It.IsAny<Issue>()))
                .Returns(Task.FromResult(issue));

            _mockMediator
                .Setup(x => x.Publish(It.IsAny<INotification>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.ReportIssueAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be(request.Title);
            result.Description.Should().Be(request.Description);
            result.Category.Should().Be(request.Category);
            result.PhotoUrl.Should().Be(request.PhotoUrl);
            result.UserId.Should().Be(request.UserId);
            result.DepartmentId.Should().Be(request.DepartmentId);
            result.Status.Should().Be(IssueStatus.Pending.ToString());

            _mockRepository.Verify(x => x.CreateAsync(It.IsAny<Issue>()), Times.Once);
            _mockMediator.Verify(x => x.Publish(It.IsAny<INotification>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        }

        [Fact]
        public async Task GetIssueByIdAsync_ExistingIssue_ReturnsIssue()
        {
            // Arrange
            var issueId = "issue123";
            var existingIssue = new Issue(
                "Test Issue",
                "Test Description",
                "Test Category",
                "http://test.com/photo.jpg",
                "user123",
                "dept123"
            );

            _mockRepository
                .Setup(x => x.GetByIdAsync(issueId))
                .Returns(Task.FromResult(existingIssue));

            // Act
            var result = await _service.GetIssueByIdAsync(issueId);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be(existingIssue.Title);
            result.Description.Should().Be(existingIssue.Description);
            result.Category.Should().Be(existingIssue.Category);
            result.Status.Should().Be(existingIssue.Status.ToString());
        }

        [Fact]
        public async Task GetIssueByIdAsync_NonExistingIssue_ThrowsException()
        {
            // Arrange
            var issueId = "nonexistent";
            _mockRepository
                .Setup(x => x.GetByIdAsync(issueId))
                .Returns(Task.FromResult<Issue>(null));

            // Act & Assert
            await _service.Invoking(s => s.GetIssueByIdAsync(issueId))
                .Should().ThrowAsync<Exception>()
                .WithMessage("Issue not found");
        }

        [Fact]
        public async Task UpdateIssueStatusAsync_ValidStatus_UpdatesAndPublishesEvent()
        {
            // Arrange
            var issueId = "issue123";
            var newStatus = IssueStatus.Resolved;
            var existingIssue = new Issue(
                "Test Issue",
                "Test Description",
                "Test Category",
                "http://test.com/photo.jpg",
                "user123",
                "dept123"
            );

            _mockRepository
                .Setup(x => x.GetByIdAsync(issueId))
                .Returns(Task.FromResult(existingIssue));

            _mockMediator
                .Setup(x => x.Publish(It.IsAny<INotification>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            await _service.UpdateIssueStatusAsync(issueId, newStatus);

            // Assert
            _mockRepository.Verify(x => x.UpdateStatusAsync(issueId, newStatus), Times.Once);
            _mockMediator.Verify(x => x.Publish(It.IsAny<INotification>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        }

        [Fact]
        public async Task UpdateIssueStatusAsync_NonExistingIssue_ThrowsException()
        {
            // Arrange
            var issueId = "nonexistent";
            var newStatus = IssueStatus.Resolved;

            _mockRepository
                .Setup(x => x.GetByIdAsync(issueId))
                .Returns(Task.FromResult<Issue>(null));

            // Act & Assert
            await _service.Invoking(s => s.UpdateIssueStatusAsync(issueId, newStatus))
                .Should().ThrowAsync<Exception>()
                .WithMessage("Issue not found");

            _mockRepository.Verify(x => x.UpdateStatusAsync(It.IsAny<string>(), It.IsAny<IssueStatus>()), Times.Never);
            _mockMediator.Verify(x => x.Publish(It.IsAny<INotification>(), It.IsAny<CancellationToken>()), Times.Never);
        }
    }
} 