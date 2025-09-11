export default function BookingRequest() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Request a Booking</h1>
      <form className="space-y-4">
        <input type="text" placeholder="Event Name" className="border p-2 w-full rounded" />
        <input type="date" className="border p-2 w-full rounded" />
        <textarea placeholder="Details" className="border p-2 w-full rounded"></textarea>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
      </form>
    </div>
  );
}
