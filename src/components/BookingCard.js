export default function BookingCard({ booking }) {
  return (
    <div className="p-4 border rounded shadow mb-2">
      <h3 className="text-lg font-bold">{booking.event}</h3>
      <p className="text-gray-600">{booking.date}</p>
      <p>
        Status: <span className="font-semibold">{booking.status}</span>
      </p>
    </div>
  );
}
