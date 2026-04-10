{/* COMMENT */}
{task.comment && (
  <div className="mt-3 text-sm bg-gray-100 dark:bg-zinc-700 p-2 rounded-lg whitespace-pre-line">
    {task.comment}
  </div>
)}

{/* 📎 ФАЙЛ (оформление / паспорта) */}
{(task.type === 'registration' || task.type === 'passport') && task.file && (
  <a
    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/docs/${task.file}`}
    target="_blank"
    className="text-[#0131FF] text-sm mt-2 inline-block"
  >
    📥 Скачать файл
  </a>
)}
