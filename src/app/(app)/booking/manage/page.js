//app/(app)/booking/manage/page.js


export default function BookingManagement() {
  const bookings = [
    { id: 1, event: "Wedding", status: "Pending" },
    { id: 2, event: "Church Service", status: "Confirmed" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">My Bookings</h1>
      <ul>
        {bookings.map((b) => (
          <li key={b.id} className="p-2 border rounded mb-2">
            {b.event} - <span className="font-semibold">{b.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
