import org.viz.lightning._
import scala.util.Random

val lgn = Lightning()

val series = Array.fill(10)(Array.fill(500)(Random.nextFloat()))

lgn.line(series)
