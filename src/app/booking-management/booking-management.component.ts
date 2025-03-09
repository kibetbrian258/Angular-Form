import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AdminService } from '../Service/admin.service';
import { SnackbarService } from '../Service/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

interface Booking {
  id: number;
  location: string;
  time: string;
  date: string;
  createdAt: string;
  serviceRequired: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Extended interface for table items (bookings with date groups)
interface TableItem {
  isDateGroup: boolean;
  groupName?: string;
  booking?: Booking;
}

@Component({
  selector: 'app-booking-management',
  templateUrl: './booking-management.component.html',
  styleUrls: ['./booking-management.component.css'],
})
export class BookingManagementComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;

  bookings: Booking[] = [];
  tableData: TableItem[] = [];
  dataSource = new MatTableDataSource<TableItem>([]);
  isLoading = false;
  displayedColumns: string[] = [
    'id',
    'name',
    'service',
    'date',
    'time',
    'location',
    'actions',
  ];

  dateFilter = new FormControl('');
  serviceFilter = new FormControl('');
  clientFilter = new FormControl('');

  services: string[] = [];
  clients: { id: number; name: string }[] = [];

  constructor(
    private adminService: AdminService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadBookings();

    // Set up filters
    this.dateFilter.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    this.serviceFilter.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    this.clientFilter.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  // After view initialization, set the sort for the data source
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;

    // Custom sort function for date column
    this.dataSource.sortingDataAccessor = (
      item: TableItem,
      property: string
    ) => {
      // Skip date groups for sorting
      if (item.isDateGroup) {
        return '';
      }

      // Ensure the item has a booking
      if (!item.booking) {
        return '';
      }

      // Sort items based on booking properties
      const booking = item.booking;
      switch (property) {
        case 'date':
          return new Date(booking.date).getTime();
        case 'id':
          return booking.id;
        case 'name':
          return booking.user
            ? `${booking.user.firstName} ${booking.user.lastName}`.toLowerCase()
            : '';
        case 'service':
          return booking.serviceRequired
            ? booking.serviceRequired.toLowerCase()
            : '';
        case 'time':
          return booking.time;
        case 'location':
          return booking.location ? booking.location.toLowerCase() : '';
        default:
          return '';
      }
    };

    // Custom filter predicate for handling both bookings and date groups
    this.dataSource.filterPredicate = (data: TableItem, filter: string) => {
      // Always include date group rows
      if (data.isDateGroup) {
        return true;
      }

      // Skip if no booking
      if (!data.booking) {
        return false;
      }

      // Custom filter logic for bookings
      const booking = data.booking;
      const searchStr = filter.toLowerCase();

      return (
        booking.id.toString().includes(searchStr) ||
        (booking.location &&
          booking.location.toLowerCase().includes(searchStr)) ||
        (booking.serviceRequired &&
          booking.serviceRequired.toLowerCase().includes(searchStr)) ||
        (booking.user &&
          booking.user.firstName.toLowerCase().includes(searchStr)) ||
        (booking.user &&
          booking.user.lastName.toLowerCase().includes(searchStr)) ||
        (booking.user && booking.user.email.toLowerCase().includes(searchStr))
      );
    };
  }

  loadBookings(): void {
    this.isLoading = true;
    this.adminService.getBookings().subscribe({
      next: (data) => {
        this.bookings = data;

        // Generate table data with proper sorting
        this.generateTableData();

        this.extractServices();
        this.extractClients();
        this.isLoading = false;
      },
      error: (error) => {
        this.snackbarService.showError('Failed to load bookings', 'Close');
        this.isLoading = false;
        console.error('Error loading bookings:', error);
      },
    });
  }

  // Sort bookings by date (latest first)
  sortBookingsByDate(bookings: Booking[]): void {
    bookings.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // For descending order (latest first)
    });
  }

  // Generate table data with date group headers in proper order

  generateTableData(): void {
    // First sort bookings properly using our custom sorting logic
    this.sortBookings();

    // Group bookings by date
    const bookingsByGroup: {
      [key: string]: {
        bookings: Booking[];
        order: number; // Used for ordering groups
      };
    } = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Initialize categories
    bookingsByGroup['Today'] = { bookings: [], order: 0 };

    // Group bookings by creation date first
    this.bookings.forEach((booking) => {
      const createdAt = new Date(booking.createdAt || booking.date); // Fallback
      const isCreatedToday = this.isToday(createdAt);

      if (isCreatedToday) {
        // Add to today's group
        bookingsByGroup['Today'].bookings.push(booking);
      } else {
        // Group by service date
        const bookingDate = new Date(booking.date);
        const dateLabel = this.formatDateFull(booking.date);

        if (!bookingsByGroup[dateLabel]) {
          // Determine order for this group (based on service date)
          // Future dates get higher order than past
          const isFuture = bookingDate > today;
          const order = isFuture ? 1 : 2;

          bookingsByGroup[dateLabel] = {
            bookings: [],
            order: order,
          };
        }

        bookingsByGroup[dateLabel].bookings.push(booking);
      }
    });

    // Build the final table items array with headers and booking rows
    const tableItems: TableItem[] = [];

    // Get all groups and sort them by the order property
    const groupsInOrder = Object.entries(bookingsByGroup).sort((a, b) => {
      // First sort by the order property
      if (a[1].order !== b[1].order) {
        return a[1].order - b[1].order;
      }

      // If same order category, sort chronologically
      if (a[0] === 'Today') return -1;
      if (b[0] === 'Today') return 1;

      const dateA = new Date(a[1].bookings[0]?.date || '');
      const dateB = new Date(b[1].bookings[0]?.date || '');
      return dateB.getTime() - dateA.getTime(); // Descending order for dates
    });

    // Process each group
    groupsInOrder.forEach(([groupName, groupData]) => {
      // Only add groups that have bookings
      if (groupData.bookings.length > 0) {
        // Add group header
        tableItems.push({
          isDateGroup: true,
          groupName: groupName,
        });

        // Add bookings for this group, sorted by time
        const sortedBookings = [...groupData.bookings].sort((a, b) =>
          a.time.localeCompare(b.time)
        );

        sortedBookings.forEach((booking) => {
          tableItems.push({
            isDateGroup: false,
            booking: booking,
          });
        });
      }
    });

    this.tableData = tableItems;
    this.dataSource.data = tableItems;
  }
  // Sort bookings: Today's new bookings first, then previous days in chronological order
  sortBookings(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get current timestamp for comparison
    const currentTimestamp = new Date().getTime();

    this.bookings.sort((a, b) => {
      // Use createdAt if available, or use the current timestamp for new bookings (high IDs)
      let createdAtA: Date;
      let createdAtB: Date;

      // Determine if this is a new booking (created today)
      // Strategy 1: Check createdAt field if available
      if (a.createdAt) {
        createdAtA = new Date(a.createdAt);
      } else {
        // Strategy 2: Assume high IDs are new bookings
        // This is a heuristic - higher IDs are typically newer bookings
        createdAtA = a.id > 30 ? new Date() : new Date(a.date);
      }

      if (b.createdAt) {
        createdAtB = new Date(b.createdAt);
      } else {
        createdAtB = b.id > 30 ? new Date() : new Date(b.date);
      }

      const createdTodayA = this.isToday(createdAtA);
      const createdTodayB = this.isToday(createdAtB);

      // If one was created today and the other wasn't, prioritize the one created today
      if (createdTodayA && !createdTodayB) {
        return -1;
      }
      if (!createdTodayA && createdTodayB) {
        return 1;
      }

      // If both created today or both not created today,
      // sort by service date
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      // For appointments on the same day, sort by time
      if (dateA.toDateString() === dateB.toDateString()) {
        return a.time.localeCompare(b.time);
      }

      // Otherwise, sort chronologically (nearest future dates first, then past dates)
      return dateA.getTime() - dateB.getTime();
    });
  }

  // Helper function to check if a date is today
  private isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  // Helper function to categorize dates
  private getDateCategory(date: Date, today: Date): number {
    // Today
    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    ) {
      return 2;
    }

    // Future date
    if (date.getTime() > today.getTime()) {
      return 1;
    }

    // Past date
    return 0;
  }

  // Extended date format for group headers
  formatDateFull(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  }

  extractServices(): void {
    // Extract unique services from bookings
    const serviceSet = new Set<string>();
    this.bookings.forEach((booking) => {
      if (booking.serviceRequired) {
        serviceSet.add(booking.serviceRequired);
      }
    });
    this.services = Array.from(serviceSet);
  }

  extractClients(): void {
    // Extract unique clients from bookings
    const clientMap = new Map<number, string>();
    this.bookings.forEach((booking) => {
      if (booking.user?.id) {
        const fullName = `${booking.user.firstName} ${booking.user.lastName}`;
        clientMap.set(booking.user.id, fullName);
      }
    });

    this.clients = Array.from(clientMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }

  applyFilters(): void {
    let filtered = [...this.bookings];

    const dateValue = this.dateFilter.value;
    if (dateValue) {
      const filterDate = new Date(dateValue);
      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.date);
        return bookingDate.toDateString() === filterDate.toDateString();
      });
    }

    const serviceValue = this.serviceFilter.value;
    if (serviceValue) {
      filtered = filtered.filter(
        (booking) => booking.serviceRequired === serviceValue
      );
    }

    const clientValue = this.clientFilter.value;
    if (clientValue) {
      filtered = filtered.filter(
        (booking) => booking.user?.id === Number(clientValue)
      );
    }

    // Update bookings array with filtered data
    this.bookings = filtered;

    // Generate table data with the filtered bookings
    this.generateTableData();
  }

  clearFilters(): void {
    this.dateFilter.setValue('');
    this.serviceFilter.setValue('');
    this.clientFilter.setValue('');

    // Reload original data
    this.adminService.getBookings().subscribe({
      next: (data) => {
        this.bookings = data;
        // Use the new sorting method instead of sortBookingsByDate
        this.generateTableData(); // This calls sortBookings() internally
      },
      error: (error) => {
        this.snackbarService.showError('Failed to reload bookings', 'Close');
        console.error('Error reloading bookings:', error);
      },
    });
  }

  // Check if this is a date group row
  isDateGroup(index: number, item: TableItem): boolean {
    return item.isDateGroup;
  }

  // Check if this is a booking row
  isBookingRow(index: number, item: TableItem): boolean {
    return !item.isDateGroup;
  }

  // Count how many bookings a client has
  getClientBookingCount(userId: number): number {
    return this.bookings.filter((booking) => booking.user?.id === userId)
      .length;
  }

  cancelBooking(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Cancellation',
        message:
          'Are you sure you want to cancel this booking? This action cannot be undone.',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;
        this.adminService.cancelBooking(id).subscribe({
          next: () => {
            this.snackbarService.showSuccess(
              'Booking cancelled successfully',
              'Close'
            );
            this.loadBookings();
          },
          error: (error) => {
            this.snackbarService.showError('Failed to cancel booking', 'Close');
            this.isLoading = false;
            console.error('Error cancelling booking:', error);
          },
        });
      }
    });
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  }

  formatTime(timeString: string): string {
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return timeString;
    }
  }
}
